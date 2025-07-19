const fileInput = document.getElementById('fileInput');
  const fileText = document.querySelector('.file-upload-text');
  const fileListContainer = document.createElement('div');
  fileListContainer.className = 'uploaded-file-list';
  document.querySelector('.file-upload-area').after(fileListContainer);

  let uploadedFiles = [];

  // لما يختار المستخدم ملف
  fileInput.addEventListener('change', function (e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      uploadedFiles.push(file);
    });

    updateFileList(); // تحديث عرض الملفات
  });

  // تحديث عرض الملفات
  function updateFileList() {
    fileListContainer.innerHTML = '';

    uploadedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'file-item';

      item.innerHTML = `
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${formatSize(file.size)}</div>
        </div>
        <button class="remove-btn" onclick="removeFile(${index})"><i class="fas fa-times"></i></button>
      `;

      fileListContainer.appendChild(item);
    });

    fileText.textContent = uploadedFiles.length > 0
      ? `${uploadedFiles.length} file(s) selected`
      : "Files uploaded successfully";
  }

  // إزالة ملف معين
  function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFileList();
  }

  // تنسيق حجم الملف
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // زر الإرسال
function sendMessage() {
  const message = document.getElementById('messageInput').value.trim();

  if (!message) {
    alert("Please type a message before sending.");
    return;
  }

  if (uploadedFiles.length === 0) {
    alert("Please upload at least one file.");
    return;
  }

  // إرسال الإيميل عبر mailto
  const email = "1929@gaca.gov.sa";
  const subject = encodeURIComponent("Simulator Certificate Submission");
  const body = encodeURIComponent(`Dear GACA,\n\n${message}\n\nAttached files: ${uploadedFiles.length} file(s).`);
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

  // مسح الحقول بعد الإرسال
  document.getElementById('messageInput').value = '';
  fileInput.value = '';
  uploadedFiles = [];
  updateFileList();
}