import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export const openFile = (req: Request, res: Response) => {
  const filePath = req.query.path as string;

  if (!filePath) {
    return res.status(400).json({ error: "No path provided" });
  }

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({ error: "File not found" });
  }

  // Serve inline so browser opens it (not downloads)
  res.sendFile(resolvedPath, { headers: { "Content-Disposition": "inline" } });
};
