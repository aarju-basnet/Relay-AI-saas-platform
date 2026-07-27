import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "@/config/postgres";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("Google account has no email"));

        // Find existing user by providerId, or link/create by email
        let user = await prisma.user.findFirst({
          where: { OR: [{ providerId: profile.id }, { email }] },
        });

        if (!user) {
          // New Google sign-ups create just the personal account - like
          // email registration, workspace creation is a separate step.
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              avatarUrl: profile.photos?.[0]?.value,
              provider: "google",
              providerId: profile.id,
              emailVerified: true, // Google already verified this email address
            },
          });
        } else if (!user.providerId) {
          // Existing local-account user signing in with Google for the first time
          user = await prisma.user.update({
            where: { id: user.id },
            data: { provider: "google", providerId: profile.id, emailVerified: true },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;