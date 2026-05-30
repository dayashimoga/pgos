// ============================================================
// @pgos/context-engine — Domain Extractor
// Extracts rich domain intelligence, glossary, entities, and aggregates.
// ============================================================

import { ParsedFile } from '../parser/ast-parser.js';
import type { DomainModel, DomainEntity, DomainRelation } from '@pgos/core';

export function extractDomainModel(mockRoot: string, files: ParsedFile[]): DomainModel {
  const entities: DomainEntity[] = [];
  const relations: DomainRelation[] = [];
  const glossary = new Map<string, string>();

  for (const f of files) {
    // Entities and classes analysis
    for (const c of f.classes) {
      const isDomainEntity = /entity|aggregate|valueobject|model|dto/i.test(c.name) || f.path.includes('domain');
      if (isDomainEntity) {
        let type: DomainEntity['type'] = 'entity';
        if (/aggregate/i.test(c.name)) type = 'aggregate';
        else if (/dto/i.test(c.name)) type = 'dto';
        else if (/enum/i.test(c.name)) type = 'enum';
        
        entities.push({
          name: c.name,
          type,
          properties: c.implements ? [c.implements] : [],
          sourceFile: f.path,
          description: `Domain model component class: ${c.name}`,
        });

        // Add to glossary
        glossary.set(c.name, `Core business domain model ${type} class for ${c.name} context.`);

        // Build simple relations from extends
        if (c.extends) {
          relations.push({
            from: c.name,
            to: c.extends,
            type: 'extends',
          });
        }
      }
    }

    // Capture enum files
    for (const en of f.enums) {
      entities.push({
        name: en,
        type: 'enum',
        properties: [],
        sourceFile: f.path,
        description: `Domain enumeration: ${en}`,
      });
      glossary.set(en, `Enumeration values list for ${en} properties.`);
    }

    // Capture interface files
    for (const inf of f.interfaces) {
      entities.push({
        name: inf,
        type: 'value-object',
        properties: [],
        sourceFile: f.path,
        description: `Domain interface definition: ${inf}`,
      });
      glossary.set(inf, `Value-object interface data boundary contract for ${inf}.`);
    }
  }

  // Fallback defaults
  if (entities.length === 0) {
    entities.push({
      name: 'DefaultDomainModel',
      type: 'entity',
      properties: ['id', 'createdAt'],
      sourceFile: 'src/domain/index.ts',
      description: 'System placeholder default domain model entity',
    });
    glossary.set('DefaultDomainModel', 'Fallback standard model representing application state.');
  }

  return {
    entities,
    relations,
    constraints: ['Primary keys must be unique', 'Records require creation timestamps'],
    invariants: [],
    lifecycles: [],
    glossary: Object.entries(Object.fromEntries(glossary)).map(([term, definition]) => ({
      term,
      definition,
      source: 'AST Inference',
    })),
  };
}
