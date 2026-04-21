import Handlebars from "handlebars";

// Inject data in HTML and return
export function renderTemplate(
  template: string,
  data: Record<string, any>
) {
  const compiled = Handlebars.compile(template);
  return compiled(data);
}