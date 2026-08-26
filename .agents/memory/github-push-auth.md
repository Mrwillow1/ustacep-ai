---
name: GitHub push authentication
description: Fine-grained GitHub token requirements and safe HTTPS push behavior for this project.
---

GitHub connector erişimi ile yerel Git HTTPS push erişimi birbirinden bağımsız olabilir. Fine-grained token, hedef repository’ye açıkça sınırlandırılmalı ve `Contents: Read and write` yetkisine sahip olmalıdır; yerel push, token değerini göstermeden süreç ortamından okuyan askpass ile ve mevcut credential helper devre dışı bırakılarak yapılmalıdır.

**Why:** Repository API okuması başarılı olsa bile eksik veya yanlış token kapsamı Git Database API ve Git push işlemlerinde 401/403 üretebilir.

**How to apply:** Push öncesi hedef repository kapsamını ve Contents yazma yetkisini doğrula; geçici remote ref’i koruyan `force-with-lease` kullan ve sonrasında `git ls-remote origin refs/heads/main` ile yerel SHA’yı karşılaştır.