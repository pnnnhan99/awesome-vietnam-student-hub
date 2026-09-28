import fs from 'fs';

const data = JSON.parse(fs.readFileSync(new URL('../data/student-hub.json', import.meta.url), 'utf-8'));

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    clearTimeout(timeout);
    if (res.status === 403 || (res.status >= 200 && res.status < 400)) {
      return { status: '🟢 Hoạt động' };
    }
    return { status: '🔴 Không phản hồi' };
  } catch {
    clearTimeout(timeout);
    return { status: '🔴 Không phản hồi' };
  }
}

async function main() {
  const results = await Promise.all(data.map(async (item) => {
    const check = await checkUrl(item.url);
    return { ...item, ...check };
  }));

  const categories = {};
  for (const item of results) {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  }

  const totalResources = results.length;
  const activeLinks = results.filter(r => r.status === '🟢 Hoạt động').length;

  let markdown = `# 🎓 Awesome Vietnam Student Hub

[![Total Resources](https://img.shields.io/badge/Total%20Resources-${totalResources}-blue)](https://github.com/itvn-dev/awesome-vietnam-student-hub)
[![Active Links](https://img.shields.io/badge/Active%20Links-${activeLinks}-green)](https://github.com/itvn-dev/awesome-vietnam-student-hub)
[![Auto Update](https://img.shields.io/badge/Auto%20Update-Every%20Night-%23FFA500)](https://github.com/itvn-dev/awesome-vietnam-student-hub/actions)

🎓 Trạm tri thức & Kho đặc quyền dành cho Học sinh - Sinh viên Việt Nam. Tổng hợp các mẹo tối ưu hóa email \`.edu.vn\` để nhận phần mềm miễn phí trị giá hàng ngàn đô, cùng với các kho dữ liệu mở hỗ trợ làm đồ án xuất sắc. Liên tục tự động kiểm tra link sống/chết mỗi đêm!

---

`;

  for (const [category, items] of Object.entries(categories)) {
    markdown += `## ${category}\n\n`;
    markdown += `| Tên Tài nguyên / Nền tảng (Gắn link) | Lợi ích mang lại | Yêu cầu Mail .edu.vn? | Trạng thái web |\n`;
    markdown += `|---|---|---|---|\n`;
    for (const item of items) {
      markdown += `| [${item.name}](${item.url}) | ${item.benefit} | ${item.requireEduEmail} | ${item.status} |\n`;
    }
    markdown += `\n`;
  }

  fs.writeFileSync(new URL('../README.md', import.meta.url), markdown);
  console.log(`✅ README.md generated with ${totalResources} resources (${activeLinks} active)`);
}

main();
