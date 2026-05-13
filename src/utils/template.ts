import Handlebars from "handlebars";

// Inject data in HTML and return
export function renderTemplate(
  template: string,
  data: Record<string, any>,
  options?: { escape?: boolean }
) {
  console.log(template)
  const compiled = Handlebars.compile(template, { 
    noEscape: !(options?.escape ?? true)  // escape by default
  });
  return compiled(data);
}