
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css?inline" {
  const content: string;
  export default content;
}
