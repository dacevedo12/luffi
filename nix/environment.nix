{ makeNodejsEnv, pkgs, projectPath }:
let
  nodejsEnv = makeNodejsEnv {
    inherit pkgs;
    name = "luffi";
    workspaceRoot = ./.;
  };

  dependencies = [ nodejsEnv pkgs.bun pkgs.deno pkgs.nodejs_22 ];
in { inherit dependencies; }
