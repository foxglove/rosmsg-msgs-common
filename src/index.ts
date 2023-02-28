import { parse, ParseOptions } from "@foxglove/rosmsg";
import { MessageDefinition } from "@foxglove/message-definition";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import { join, basename, sep } from "path";
import { format, Options } from "prettier";

const LICENSE = `// This Source Code Form is subject to the terms of the MIT
// License. If a copy of the MIT license was not distributed with this
// file, You can obtain one at https://opensource.org/license/mit/`;

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
  const msgdefsRos2GalacticPath = join(__dirname, "..", "msgdefs", "ros2galactic");
  const msgdefsRos2HumblePath = join(__dirname, "..", "msgdefs", "ros2humble");
  const distDir = join(__dirname, "..", "dist");
  const libFile = join(distDir, "index.js");
  const declFile = join(distDir, "index.d.ts");
  const definitionsByGroup = new Map<string, Record<string, MessageDefinition>>([
    ["ros1", {}],
    ["ros2galactic", {}],
    ["ros2humble", {}],
  ]);

  await loadDefinitions(msgdefsRos1Path, definitionsByGroup.get("ros1")!, {});
  await loadDefinitions(msgdefsRos2GalacticPath, definitionsByGroup.get("ros2galactic")!, {
    ros2: true,
  });
  await loadDefinitions(msgdefsRos2HumblePath, definitionsByGroup.get("ros2humble")!, {
    ros2: true,
  });

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
  definitions: Record<string, MessageDefinition>,
  parseOptions: ParseOptions,
): Promise<void> {
  const msgFiles = await getMsgFiles(msgdefsPath);
  for (const filename of msgFiles) {
    const dataType = filenameToDataType(filename);
    const typeName = dataTypeToTypeName(dataType);
    const msgdef = await readFile(filename, { encoding: "utf8" });
    const schema = parse(msgdef, parseOptions);
    (schema[0] as MessageDefinition).name = typeName;
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
  definitionsByGroup: Map<string, Record<string, MessageDefinition>>,
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
  definitionsByGroup: Map<string, Record<string, MessageDefinition>>,
): string {
  let output = `${LICENSE}

import { MessageDefinition } from "@foxglove/message-definition";
`;

  for (const [groupName, definitions] of definitionsByGroup.entries()) {
    const entries = Object.keys(definitions)
      .sort()
      .map((key) => `  "${key}": MessageDefinition;`)
      .join("\n");
    output += `
export type ${exportedTypeName(groupName)} = {
${entries}
};
`;
  }

  output += `\n`;
  for (const groupName of definitionsByGroup.keys()) {
    output += `declare const ${groupName}: ${exportedTypeName(groupName)};\n`;
  }

  output += `export { ${[...definitionsByGroup.keys()].join(", ")} };\n`;
  return output;
}

function exportedTypeName(groupName: string): string {
  // Uppercase the first letter of `groupName` and any letter following a number
  const camelCase = `${groupName[0]!.toUpperCase()}${groupName
    .slice(1)
    .replace(/([0-9])([a-z])/, (m) => m[0]! + m[1]!.toUpperCase())}`;
  return `${camelCase}MsgCommonDefinitions`;
}

void main();
