import { getLatestVersion } from "nudd/deps.ts";
import { Registry } from "nudd/registry/utils.ts";
import { DenoLand } from "nudd/registry/denoland.ts";
import { JsDelivr } from "nudd/registry/jsdelivr.ts";
import { Unpkg } from "nudd/registry/unpkg.ts";
import { Denopkg } from "nudd/registry/denopkg.ts";
import { DenoRe } from "nudd/registry/denore.ts";
import { PaxDeno } from "nudd/registry/paxdeno.ts";
import { Jspm } from "nudd/registry/jspm.ts";
import { Skypack } from "nudd/registry/skypack.ts";
import { EsmSh } from "nudd/registry/esm.ts";
import { GithubRaw } from "nudd/registry/github.ts";
import { GitlabRaw } from "nudd/registry/gitlab.ts";
import { NestLand } from "nudd/registry/nestland.ts";
import { Npm } from "nudd/registry/npm.ts";
import { Jsr } from "nudd/registry/jsr.ts";

const registries: Registry[] = [
  DenoLand,
  Unpkg,
  Denopkg,
  DenoRe,
  PaxDeno,
  Jspm,
  Skypack,
  EsmSh,
  GithubRaw,
  GitlabRaw,
  JsDelivr,
  NestLand,
  Npm,
  Jsr,
];

const pattern = new URLPattern({
  pathname: "/:registry/{:scope}{/:pkg}?",
});

const cache = new Map<string, PackageData>();

interface PackageData {
  name: string;
  type: string;
  version: string;
  url: string;
  timestamp: number;
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const match = pattern.exec(url);

  if (!match) {
    return new Response("Not found", { status: 404 });
  }

  const { registry, scope, pkg } = match.pathname.groups;

  if (!registry || !scope) {
    return new Response("Not found", { status: 404 });
  }
  const name = pkg ? `${scope}/${pkg}` : scope;
  const key = `${registry}/${name}`;
  const data = cache.get(key);

  if (data && Date.now() - data.timestamp < 1000 * 60 * 60) {
    return Response.json(data);
  }

  const R = registries.find((r) => r.type === registry);

  if (!R) {
    return new Response("Not found", { status: 404 });
  }

  const info = new R({ name, version: "", type: R.type });
  const version = getLatestVersion(await info.versions());
  return Response.json({
    name,
    type: R.type,
    version,
    url: info.at(version),
    timestamp: Date.now(),
  });
}

export default {
  fetch: handleRequest,
};
