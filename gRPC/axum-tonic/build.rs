use std::{env, path::PathBuf};

fn main() {
    let out_dir = PathBuf::from(env::var("OUT_DIR").unwrap());
    tonic_build::configure()
        .file_descriptor_set_path(out_dir.join("helloworld_descriptor.bin"))
        .compile(&["proto/helloworld.proto"], &["proto"])
        .unwrap();
    // tonic_build::compile_protos("proto/helloworld.proto").expect("Failed to compile protos");
}
