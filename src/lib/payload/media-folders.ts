import type { CollectionBeforeDeleteHook, CollectionConfig } from "payload";
import { can } from "../../access/can.ts";

const preventNonemptyFolderDeletion: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const [media, subfolders] = await Promise.all([
    req.payload.find({
      collection: "media",
      where: { folder: { equals: id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    }),
    req.payload.find({
      collection: "payload-folders",
      where: { folder: { equals: id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    }),
  ]);

  if (media.totalDocs || subfolders.totalDocs) {
    throw new Error("Mova as midias e subpastas antes de excluir esta pasta.");
  }
};

export function restrictMediaFolders({ collection }: { collection: CollectionConfig }): CollectionConfig {
  return {
    ...collection,
    fields: [
      ...collection.fields.map((field) =>
        "name" in field && field.name === "folderType"
          ? { ...field, label: "Coleções permitidas" }
          : field,
      ),
      {
        name: "tags",
        type: "text",
        hasMany: true,
        label: "Tags editoriais",
        admin: {
          description: "Digite as etiquetas que ajudam a identificar esta pasta, como Home, Manuais ou Logos.",
          position: "sidebar",
        },
      },
    ],
    access: {
      ...collection.access,
      read: ({ req }) => can(req.user, "media.read"),
      create: ({ req }) => can(req.user, "media.create"),
      update: ({ req }) => can(req.user, "media.update"),
      delete: ({ req }) => can(req.user, "media.delete"),
    },
    hooks: {
      ...collection.hooks,
      beforeDelete: [preventNonemptyFolderDeletion, ...(collection.hooks?.beforeDelete || [])],
    },
  };
}
