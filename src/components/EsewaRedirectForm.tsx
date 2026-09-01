import { useEffect, useRef } from "react";

interface Props {
  formUrl: string;
  fields: Record<string, string>;
}

export default function EsewaRedirectForm({ formUrl, fields }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <form ref={formRef} action={formUrl} method="POST" style={{ display: "none" }}>
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
    </form>
  );
}