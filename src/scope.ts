import mongoose from 'mongoose';
import type { Request } from 'express';
import { ApiException } from './http-error';

export function tenantObjectId(req: Request): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(req.authUser!.tenantId);
}

export function parseObjectId(value: string, key = 'id'): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiException(400, `validation.invalid_${key}`);
  }
  return new mongoose.Types.ObjectId(value);
}

export function dateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function namedId(doc: { _id: unknown; name?: string; code?: string } | null | undefined) {
  if (!doc) {
    return null;
  }
  return {
    id: String(doc._id),
    name: doc.name ?? '',
    code: doc.code ?? '',
  };
}
