// تفعيل العنصر المحدد من القائمة الجانبية
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// عند تغيير القيمة من قائمة Dashboard الرئيسية (dropdown)
const dashboardSelect = document.getElementById('dashboard-select');
if (dashboardSelect) {
  dashboardSelect.addEventListener('change', (e) => {
    console.log(`Selected Dashboard: ${e.target.value}`);
    // هنا تقدر تضيف منطق لتغيير المحتوى حسب الاختيار
  });
}