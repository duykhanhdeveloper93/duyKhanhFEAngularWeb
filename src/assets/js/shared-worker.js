const connections = [];

onconnect = function (e) {
  const port = e.ports[0];
  connections.push(port);

  port.onmessage = function (event) {
    const message = event.data;
    // Xử lý dữ liệu hoặc thực hiện các hành động khác với message
    // Sau đó, gửi kết quả cho tất cả các kết nối khác
    connections.forEach(connection => connection.postMessage(message));
  };

  port.start();
};
