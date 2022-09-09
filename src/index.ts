import { parse, ParseOptions, RosMsgDefinition } from "@foxglove/rosmsg";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import { join, basename, sep } from "path";
import { format, Options } from "prettier";

const LICENSE = `// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/`;

const PRETTIER_OPTS: Options = {
  parser: "babel",
  arrowParens: "always",
  printWidth: 100,
  trailingComma: "all",
  tabWidth: 2,
  semi: true,
};

async function main() {
  const msgdefsRos1Path = join(__dirname, "..", "msgdefs", "ros1");
  const msgdefsRos2Path = join(__dirname, "..", "msgdefs", "ros2");
  const distDir = join(__dirname, "..", "dist");
  const libFile = join(distDir, "index.js");
  const declFile = join(distDir, "index.d.ts");
  const definitionsByGroup = new Map<string, Record<string, RosMsgDefinition>>([
    ["ros1", {}],
    ["ros2", {}],
  ]);

  await loadDefinitions(msgdefsRos1Path, definitionsByGroup.get("ros1")!, {});
  await loadDefinitions(msgdefsRos2Path, definitionsByGroup.get("ros2")!, { ros2: true });

  const libOutput = generateLibrary(definitionsByGroup);
  const declOutput = generateDefinitions(definitionsByGroup);

  await mkdir(distDir, { recursive: true });
  await writeFile(libFile, libOutput);
  await writeFile(declFile, declOutput);
}

async function getMsgFiles(dir: string): Promise<string[]> {
  let output: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      output = output.concat(await getMsgFiles(join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith(".msg")) {
      output.push(join(dir, entry.name));
    }
  }
  return output;
}

async function loadDefinitions(
  msgdefsPath: string,
  definitions: Record<string, RosMsgDefinition>,
  parseOptions: ParseOptions,
): Promise<void> {
  const msgFiles = await getMsgFiles(msgdefsPath);
  for (const filename of msgFiles) {
    const dataType = filenameToDataType(filename);
    const typeName = dataTypeToTypeName(dataType);
    const msgdef = await readFile(filename, { encoding: "utf8" });
    const schema = parse(msgdef, parseOptions);
    (schema[0] as RosMsgDefinition).name = typeName;
    for (const entry of schema) {
      if (entry.name == undefined) {
        throw new Error(`Failed to parse ${dataType} from ${filename}`);
      }
      definitions[entry.name] = entry;
    }
  }
}

function filenameToDataType(filename: string): string {
  const parts = filename.split(sep);
  const newParts: string[] = [];
  const baseTypeName = basename(parts.pop()!, ".msg");
  while (parts.length > 0) {
    const part = parts.pop()!;
    newParts.unshift(part);
    if (part !== "msg") {
      break;
    }
  }
  return `${newParts.join("/")}/${baseTypeName}`;
}

function dataTypeToTypeName(dataType: string): string {
  const parts = dataType.split("/");
  if (parts.length < 2) {
    throw new Error(`Invalid data type: ${dataType}`);
  }
  const pkg = parts[0]!;
  if (pkg === "msg") {
    throw new Error(`dataType=${dataType}`);
  }
  const name = parts[parts.length - 1]!;
  return `${pkg}/${name}`;
}

function generateLibrary(
  definitionsByGroup: Map<string, Record<string, RosMsgDefinition>>,
): string {
  let lib = `${LICENSE}\n`;
  for (const [groupName, definitions] of definitionsByGroup.entries()) {
    lib += `
const ${groupName}Definitions = ${JSON.stringify(definitions)}
module.exports.${groupName} = ${groupName}Definitions
`;
  }
  return format(lib, PRETTIER_OPTS);
}

function generateDefinitions(
  definitionsByGroup: Map<string, Record<string, RosMsgDefinition>>,
): string {
  const ros1Entries = Object.keys(definitionsByGroup.get("ros1")!)
    .sort()
    .map((key) => `    "${key}": RosMsgDefinition;`)
    .join("\n");
  const ros2Entries = Object.keys(definitionsByGroup.get("ros2")!)
    .sort()
    .map((key) => `  "${key}": RosMsgDefinition;`)
    .join("\n");
  return `${LICENSE}

import { RosMsgDefinition } from "@foxglove/rosmsg";

export type Ros1MsgCommonDefinitions = {
${ros1Entries}
};

export type Ros2MsgCommonDefinitions = {
${ros2Entries}
};

declare const ros1: Ros1MsgCommonDefinitions;
declare const ros2: Ros2MsgCommonDefinitions;
export { ros1, ros2 };
`;
}

void main();
