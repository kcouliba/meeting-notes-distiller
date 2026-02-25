export interface AIProviderClient {
  readonly name: string;
  generate(notes: string): Promise<string>;
}
