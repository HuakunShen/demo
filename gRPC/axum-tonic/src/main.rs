use axum::{response::Html, routing::get, Router};
use helloworld::greeter_server::{Greeter, GreeterServer};
use helloworld::{HelloReply, HelloRequest};
use tonic::{
    transport::Server as tonic_server, Request as GRPC_Request, Response as GRPC_Response, Status,
};

pub mod helloworld {

    tonic::include_proto!("helloworld"); // The string specified here must match the proto package name
                                         // let descriptor_path = PathBuf::from("/Users/hacker/Dev/projects/Jarvis/apps/desktop/src-tauri/proto");
                                         // let descriptor_path = PathBuf::from(PathBuf::from(format!("/Users/hacker/Dev/projects/Jarvis/apps/desktop/src-tauri/proto")).join("my_descriptor.bin"));
                                         // pub(crate) const FILE_DESCRIPTOR_SET: &[u8] =
                                         //     tonic::include_file_descriptor_set!("helloworld_descriptor");
}

#[derive(Debug, Default)]
pub struct MyGreeter {}

#[tonic::async_trait]
impl Greeter for MyGreeter {
    async fn say_hello(
        &self,
        request: GRPC_Request<HelloRequest>, // Accept request of type HelloRequest
    ) -> Result<GRPC_Response<HelloReply>, Status> {
        // Return an instance of type HelloReply
        println!("Got a request: {:?}", request);

        let reply = helloworld::HelloReply {
            message: format!("Hello {}!", request.into_inner().name), // We must use .into_inner() as the fields of gRPC requests and responses are private
        };

        Ok(GRPC_Response::new(reply)) // Send back our formatted greeting
    }
}

async fn handler() -> Html<&'static str> {
    Html("<h1>Hello, World!</h1>")
}

#[tokio::main]
async fn main() {
    let addr = "[::1]:50052".parse().unwrap();
    let greeter = MyGreeter::default();

    let router = tonic_server::builder()
        .add_service(helloworld::greeter_server::GreeterServer::new(greeter))
        .into_router()
        .route("/", get(handler));
    axum::Server::bind(&addr)
        .serve(router.into_make_service())
        .await
        .expect("server failed");
}
