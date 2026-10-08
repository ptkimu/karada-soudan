const http=require("http"),fs=require("fs"),path=require("path");
const PORT=process.env.PORT||5173;
http.createServer((req,res)=>{
  const f=path.join(__dirname,"index.html");
  if(req.url!=="/"&&req.url!=="/index.html"){res.writeHead(404);return res.end("not found")}
  res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
  fs.createReadStream(f).pipe(res);
}).listen(PORT,"127.0.0.1",()=>console.log("からだ日誌: http://localhost:"+PORT));
