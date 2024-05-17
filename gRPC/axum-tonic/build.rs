fn main() {
    tonic_build::configure()
        .file_descriptor_set_path("proto/helloworld_descriptor.bin")
        .compile(&["proto/helloworld.proto"], &["proto"])
        .unwrap();
    // tonic_build::compile_protos(proto/helloworld.proto).unwrap().;
    // tonic_build::compile_protos("proto/helloworld.proto").expect("Failed to compile protos");
}
