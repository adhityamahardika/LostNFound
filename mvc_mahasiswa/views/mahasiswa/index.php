<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daftar Mahasiswa</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; color: #222; }
    table { border-collapse: collapse; }
    th, td { padding: 8px 12px; border: 1px solid #999; text-align: left; }
    th { background: #eee; }
  </style>
</head>
<body>
  <h1>Daftar Mahasiswa</h1>
  <table border="1">
    <tr><th>NIM</th><th>Nama</th><th>Prodi</th></tr>
    <?php foreach ($daftar as $m): ?>
      <tr>
        <td><?= htmlspecialchars($m['nim']) ?></td>
        <td><?= htmlspecialchars($m['nama']) ?></td>
        <td><?= htmlspecialchars($m['prodi']) ?></td>
      </tr>
    <?php endforeach; ?>
  </table>
</body>
</html>
