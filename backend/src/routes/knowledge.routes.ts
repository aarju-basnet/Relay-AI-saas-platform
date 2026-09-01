import { Router, Response } from "express";
import multer from "multer";
import * as pdfParseModule from "pdf-parse";
const pdfParse = pdfParseModule as unknown as (
  buffer: Buffer
) => Promise<{ text: string }>;
import mammoth from "mammoth";

import { requireAuth, AuthRequest } from "@/middleware/auth";
import { prisma } from "@/config/postgres";
import { getCurrentMembership } from "@/utils/membership";
import { hasActiveKnowledgeBaseAccess } from "@/utils/knowledgeAccess";
import { chunkText } from "@/utils/chunking";

const router = Router();

// Files never touch disk — held in memory just long enough to extract text.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB cap
});

async function extractText(
  buffer: Buffer,
  mimetype: string,
  originalName: string
): Promise<{ text: string; fileType: string }> {
  if (mimetype === "application/pdf") {
    const result = await pdfParse(buffer);
    return { text: result.text, fileType: "pdf" };
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, fileType: "docx" };
  }

  if (mimetype === "text/plain") {
    return { text: buffer.toString("utf-8"), fileType: "txt" };
  }

  throw new Error(
    `Unsupported file type: ${mimetype}. Please upload a PDF, DOCX, or TXT file.`
  );
}

/*
|--------------------------------------------------------------------------
| Upload Document
|--------------------------------------------------------------------------
*/

router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      const membership = await getCurrentMembership(req.auth!.userId);

      if (!membership) {
        return res.status(400).json({
          error: "You're not part of a workspace yet.",
        });
      }

      if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
        return res.status(403).json({
          error: "Only owners and admins can manage the Knowledge Base.",
        });
      }

      const access = await hasActiveKnowledgeBaseAccess(
        membership.organizationId
      );

      if (!access.allowed) {
        return res.status(402).json({ error: access.reason });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      const { text, fileType } = await extractText(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      if (!text || text.trim().length < 20) {
        return res.status(400).json({
          error: "Couldn't extract meaningful text from this file.",
        });
      }

      const chunks = chunkText(text);

      if (chunks.length === 0) {
        return res.status(400).json({
          error: "This document didn't produce any usable content.",
        });
      }

      const document = await prisma.knowledgeDocument.create({
        data: {
          organizationId: membership.organizationId,
          name: req.file.originalname,
          fileType,
          status: "READY",
          chunks: {
            create: chunks.map((content, index) => ({
              content,
              chunkIndex: index,
            })),
          },
        },
        include: { chunks: true },
      });

      return res.status(201).json({
        document: {
          id: document.id,
          name: document.name,
          fileType: document.fileType,
          status: document.status,
          chunkCount: document.chunks.length,
          createdAt: document.createdAt,
        },
      });
    } catch (error) {
      console.error("Knowledge upload error:", error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to process document.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| List Documents
|--------------------------------------------------------------------------
*/

router.get("/documents", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const membership = await getCurrentMembership(req.auth!.userId);

    if (!membership) {
      return res.status(400).json({
        error: "You're not part of a workspace yet.",
      });
    }

    const documents = await prisma.knowledgeDocument.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { chunks: true } } },
    });

    return res.json({
      documents: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        fileType: doc.fileType,
        status: doc.status,
        chunkCount: doc._count.chunks,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load documents." });
  }
});

/*
|--------------------------------------------------------------------------
| Delete Document
|--------------------------------------------------------------------------
*/

router.delete(
  "/documents/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const membership = await getCurrentMembership(req.auth!.userId);

      if (!membership) {
        return res.status(400).json({
          error: "You're not part of a workspace yet.",
        });
      }

      if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
        return res.status(403).json({
          error: "Only owners and admins can manage the Knowledge Base.",
        });
      }

      const document = await prisma.knowledgeDocument.findFirst({
        where: {
          id: req.params.id,
          organizationId: membership.organizationId,
        },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found." });
      }

      await prisma.knowledgeDocument.delete({ where: { id: document.id } });

      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to delete document." });
    }
  }
);

export default router;