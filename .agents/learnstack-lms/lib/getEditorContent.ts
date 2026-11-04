export function getEditorContent(value?: string) {
  if (!value) {
    return {
      type: "doc",
      content: [{ type: "paragraph" }],
    };
  }

  try {
    return JSON.parse(value);
  } catch {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: value }],
        },
      ],
    };
  }
}
