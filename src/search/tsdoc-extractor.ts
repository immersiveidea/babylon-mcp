import { Application, type DeclarationReflection, ReflectionKind, type ProjectReflection } from 'typedoc';
import type { ApiDocumentation } from './types.js';

export interface TypeDocConfig {
  entryPoints: string[];
  tsConfigPath?: string | undefined;
  includePrivate?: boolean | undefined;
}

export class TSDocExtractor {
  private app: Application | null = null;

  async initialize(config: TypeDocConfig): Promise<void> {
    const options: any = {
      entryPoints: config.entryPoints,
      skipErrorChecking: true,
      excludePrivate: !config.includePrivate,
      excludeInternal: true,
      compilerOptions: {
        skipLibCheck: true,
      },
    };

    // Only include tsconfig if it's defined to satisfy exactOptionalPropertyTypes
    if (config.tsConfigPath !== undefined) {
      options.tsconfig = config.tsConfigPath;
    }

    this.app = await Application.bootstrapWithPlugins(options);
  }

  async extract(): Promise<ApiDocumentation[]> {
    if (!this.app) {
      throw new Error('TSDoc extractor not initialized. Call initialize() first.');
    }

    console.log('Converting TypeScript files to TypeDoc project...');
    const project = await this.app.convert();

    if (!project) {
      throw new Error('TypeDoc conversion failed');
    }

    console.log('Extracting API documentation...');
    const apiDocs: ApiDocumentation[] = [];

    this.processProject(project, apiDocs);

    console.log(`Extracted ${apiDocs.length} API documentation entries`);
    return apiDocs;
  }

  private processProject(project: ProjectReflection, apiDocs: ApiDocumentation[]): void {
    // Process all children recursively
    if (project.children) {
      for (const child of project.children) {
        this.processReflection(child, apiDocs);
      }
    }
  }

  private processReflection(reflection: DeclarationReflection, apiDocs: ApiDocumentation[], parentName?: string): void {
    // Only process documented items
    if (!reflection.comment && !reflection.signatures?.some(sig => sig.comment)) {
      // Skip undocumented items unless they have children
      if (!reflection.children || reflection.children.length === 0) {
        return;
      }
    }

    const kind = this.getReflectionKindName(reflection.kind);
    const fullName = parentName ? `${parentName}.${reflection.name}` : reflection.name;

    // Extract documentation
    const doc = this.extractDocumentation(reflection, kind, fullName);

    if (doc) {
      apiDocs.push(doc);
    }

    // Process children recursively
    if (reflection.children) {
      for (const child of reflection.children) {
        this.processReflection(child, apiDocs, fullName);
      }
    }

    // Process signatures (for functions/methods)
    if (reflection.signatures) {
      for (const signature of reflection.signatures) {
        const sigDoc = this.extractSignatureDocumentation(signature, fullName);
        if (sigDoc) {
          apiDocs.push(sigDoc);
        }
      }
    }
  }

  private extractDocumentation(
    reflection: DeclarationReflection,
    kind: string,
    fullName: string
  ): ApiDocumentation | null {
    const comment = reflection.comment;
    if (!comment) return null;

    const summary = comment.summary.map(part => part.text).join('');
    const description = comment.blockTags
      .filter(tag => tag.tag === '@remarks')
      .map(tag => tag.content.map(part => part.text).join(''))
      .join('\n\n');

    const examples = comment.blockTags
      .filter(tag => tag.tag === '@example')
      .map(tag => tag.content.map(part => part.text).join(''));

    const deprecated = comment.blockTags
      .find(tag => tag.tag === '@deprecated')
      ?.content.map(part => part.text).join('');

    const see = comment.blockTags
      .filter(tag => tag.tag === '@see')
      .map(tag => tag.content.map(part => part.text).join(''));

    const since = comment.blockTags
      .find(tag => tag.tag === '@since')
      ?.content.map(part => part.text).join('');

    // Get source file information
    const sources = reflection.sources?.[0];
    const sourceFile = sources?.fileName || '';
    const sourceLine = sources?.line || 0;

    return {
      name: reflection.name,
      fullName,
      kind,
      summary,
      description: description || summary,
      examples,
      parameters: [],
      returns: undefined,
      type: reflection.type?.toString() || undefined,
      deprecated: deprecated || undefined,
      see,
      since: since || undefined,
      sourceFile,
      sourceLine,
    };
  }

  private extractSignatureDocumentation(
    signature: any,
    parentName: string
  ): ApiDocumentation | null {
    const comment = signature.comment;
    if (!comment) return null;

    const summary = comment.summary.map((part: any) => part.text).join('');
    const description = comment.blockTags
      ?.filter((tag: any) => tag.tag === '@remarks')
      .map((tag: any) => tag.content.map((part: any) => part.text).join(''))
      .join('\n\n') || summary;

    const examples = comment.blockTags
      ?.filter((tag: any) => tag.tag === '@example')
      .map((tag: any) => tag.content.map((part: any) => part.text).join('')) || [];

    const deprecated = comment.blockTags
      ?.find((tag: any) => tag.tag === '@deprecated')
      ?.content.map((part: any) => part.text).join('');

    const see = comment.blockTags
      ?.filter((tag: any) => tag.tag === '@see')
      .map((tag: any) => tag.content.map((part: any) => part.text).join('')) || [];

    const since = comment.blockTags
      ?.find((tag: any) => tag.tag === '@since')
      ?.content.map((part: any) => part.text).join('');

    // Extract parameters
    const parameters = signature.parameters?.map((param: any) => {
      const paramComment = comment.blockTags?.find(
        (tag: any) => tag.tag === '@param' && tag.name === param.name
      );
      return {
        name: param.name,
        type: param.type?.toString() || 'unknown',
        description: paramComment?.content.map((part: any) => part.text).join('') || '',
        optional: param.flags?.isOptional || false,
      };
    }) || [];

    // Extract return type
    const returnsTag = comment.blockTags?.find((tag: any) => tag.tag === '@returns');
    const returns = returnsTag ? {
      type: signature.type?.toString() || 'void',
      description: returnsTag.content.map((part: any) => part.text).join(''),
    } : undefined;

    const sources = signature.sources?.[0];
    const sourceFile = sources?.fileName || '';
    const sourceLine = sources?.line || 0;

    return {
      name: signature.name,
      fullName: parentName,
      kind: 'Method',
      summary,
      description,
      examples,
      parameters,
      returns,
      type: signature.type?.toString(),
      deprecated: deprecated || undefined,
      see,
      since: since || undefined,
      sourceFile,
      sourceLine,
    };
  }

  private getReflectionKindName(kind: ReflectionKind): string {
    const kindMap: Record<number, string> = {
      [ReflectionKind.Class]: 'Class',
      [ReflectionKind.Interface]: 'Interface',
      [ReflectionKind.Enum]: 'Enum',
      [ReflectionKind.Function]: 'Function',
      [ReflectionKind.Method]: 'Method',
      [ReflectionKind.Property]: 'Property',
      [ReflectionKind.TypeAlias]: 'TypeAlias',
      [ReflectionKind.Variable]: 'Variable',
      [ReflectionKind.Constructor]: 'Constructor',
      [ReflectionKind.Accessor]: 'Accessor',
      [ReflectionKind.GetSignature]: 'Getter',
      [ReflectionKind.SetSignature]: 'Setter',
    };

    return kindMap[kind] || 'Unknown';
  }
}
