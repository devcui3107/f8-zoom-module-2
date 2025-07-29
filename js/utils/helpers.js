// Hàm định dạng số theo dấu phẩy vào hàng nghìn
export function formatNumberUser(number) {
  return Number(number).toLocaleString("en-US");
}
