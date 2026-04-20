# Planlama: AI Interview Coach (Upschool 301) — Jira Parçalama

Bu doküman, `upschool301prdmvpdocument.md` PRD’sindeki MVP kapsamını **Epic → Story → Task** hiyerarşisiyle parçalar. Jira’da Epic ve Story tipleri, alt işler ise Task/Sub-task olarak açılabilir.

**Repo / ürün:** aicoachapp (mobil odaklı teslimat; PRD’deki web/responsive yaklaşımı mobil ekranlara uyarlanır.)

**Referans:** PRD bölüm 6 (MVP), 7 (User Flow), 8 (Tech Approach).

---

## Öncelik sırası (öneri)

| Sıra | Epic | Gerekçe |
|------|------|---------|
| 1 | Altyapı ve kimlik | Akışın geri kalanı için temel |
| 2 | CV analizi | Kişiselleştirilmiş mülakatın ön koşulu |
| 3 | Dinamik mülakat motoru | Çekirdek ürün değeri |
| 4 | Sesli mülakat | Ana kullanım senaryosu |
| 5 | Temel video | Non-verbal analiz (MVP “Basic”) |
| 6 | Geri bildirim ve skorlama | Değer önerisinin tamamlanması |
| 7 | Tekrar ve iyileştirme | Öğrenme döngüsü + metrikler |

---

## Epic 1 — Altyapı, proje iskeleti ve oturum

**Amaç:** Uygulama kabuğu, navigasyon, yapılandırma ve kullanıcı oturumu (PRD akışı: giriş → CV → rol → izinler).

### Story 1.1 — Repo ve mobil proje kurulumu

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T1.1.1 | Teknoloji yığını seçimi ve proje iskeleti (ör. React Native / Expo veya Flutter) dokümante | Çalışan boş ekran, build alınıyor |
| T1.1.2 | Ortam değişkenleri ve gizli anahtar yönetimi (API URL, AI anahtarları için güvenli depolama) | Prod/dev ayrımı net |
| T1.1.3 | Temel navigasyon (onboarding / ana akış iskeleti) | PRD user flow adımları ekranlara map’lendi |

### Story 1.2 — Kimlik doğrulama ve oturum

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T1.2.1 | Kayıt / giriş akışı (e-posta veya SSO — ürün kararına göre) | Kullanıcı oturum açabiliyor |
| T1.2.2 | Token yenileme ve güvenli çıkış | Oturum sonlandırıldığında hassas veri temizleniyor |
| T1.2.3 | “Giriş yapılmadan CV yükleme” PRD ile uyumlu mu netleştir; buna göre korumalı route’lar | Yetkisiz ekranlara erişim yok |

### Story 1.3 — İzinler (kamera, mikrofon)

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T1.3.1 | Mikrofon izni ve reddedilince kullanıcı dostu yönlendirme | PRD: sesli cevap için gerekli |
| T1.3.2 | Kamera izni ve ayarlara yönlendirme | PRD: temel video için gerekli |
| T1.3.3 | İzin durumunun mülakat başlamadan kontrolü | Eksik izinde mülakat başlamıyor veya net uyarı |

---

## Epic 2 — CV analizi (MVP özellik 1)

**Amaç:** PDF CV yükleme, AI ile parsing, aday profili çıkarımı.

### Story 2.1 — CV yükleme ve doğrulama

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T2.1.1 | PDF seçimi / dosya yükleme (platform API’leri) | Sadece PDF kabul (PRD) |
| T2.1.2 | Boyut ve tip doğrulama, hata mesajları | Kullanıcı hatayı anlıyor |
| T2.1.3 | Backend’e güvenli upload (veya istemci tarafı iş akışı mimari kararı) | Dosya sunucuya ulaşıyor |

### Story 2.2 — AI parsing ve profil modeli

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T2.2.1 | CV metnini çıkarma (PDF → text pipeline) | Ham metin üretiliyor |
| T2.2.2 | LLM/AI ile yapılandırılmış profil şeması (isim, deneyim, beceriler vb.) | JSON şema sabitlendi |
| T2.2.3 | Profilin yerel/ sunucu saklama stratejisi ve kullanıcıya özet gösterimi | Profil mülakat motoruna beslenebilir |

---

## Epic 3 — Dinamik mülakat motoru (MVP özellik 2)

**Amaç:** CV ve role göre soru, follow-up, gerçekçi akış.

### Story 3.1 — Rol ve parametre seçimi

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T3.1.1 | Hedef rol seçimi UI (ör. Frontend Developer) | PRD senaryosu ile uyumlu |
| T3.1.2 | Rol + CV bağlamını tek “interview context” objesinde birleştirme | Backend/AI tek kaynaktan besleniyor |

### Story 3.2 — Soru üretimi ve oturum durumu

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T3.2.1 | İlk soru seti üretimi (CV + role-based) | Mülakat başlangıcında sorular hazır |
| T3.2.2 | Follow-up soru mantığı (önceki cevaba göre) | En az bir follow-up senaryosu çalışıyor |
| T3.2.3 | Mülakat oturumu state makinesi (soru → cevap → follow-up / sonraki) | Takılı kalmayan akış |

---

## Epic 4 — Sesli mülakat (MVP özellik 3)

**Amaç:** Sesli cevap, STT, akıcılık / konuşma analizi.

### Story 4.1 — Kayıt ve konuşmayı metne çevirme

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T4.1.1 | Soru başına ses kaydı (başlat/durdur) | Kayıt dosyası veya stream pipeline tanımlı |
| T4.1.2 | Speech-to-text entegrasyonu | Metin transcript üretiliyor |
| T4.1.3 | Transcript’in mülakat oturumuna bağlanması | Sonraki adımlar transcript’i kullanıyor |

### Story 4.2 — Konuşma analizi (MVP)

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T4.2.1 | Temel metrikler: süre, duraklama, kelime sayısı (ürün kararı) | Skor/geri bildirime girdi |
| T4.2.2 | “Akıcılık” için kural veya AI özeti | Communication feedback ile tutarlı |

---

## Epic 5 — Temel video mülakat (MVP özellik 4)

**Amaç:** Kamera kaydı, yüz/göz teması, basit özgüven sinyali.

### Story 5.1 — Video yakalama

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T5.1.1 | Ön kamera önizleme ve kayıt | PRD: kamera açık senaryosu |
| T5.1.2 | Performans: düşük çözünürlük / kısa klipler (MVP) | Akıcı kullanım |

### Story 5.2 — Basit görüntü analizi

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T5.2.1 | Yüz tespiti veya göz yönü için seçilen kütüphane/API entegrasyonu | Sayısal özellik çıktısı |
| T5.2.2 | “Confidence” için basit heuristic veya model çıktısı | Feedback motoruna girdi |

---

## Epic 6 — AI geri bildirim ve skorlama (MVP özellik 5 ve 6)

**Amaç:** İçerik, iletişim, özgüven geri bildirimi; cevap / iletişim / genel skor.

### Story 6.1 — Geri bildirim motoru

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T6.1.1 | Soru + transcript (+ video özeti) ile content feedback üretimi | Her cevap için metin geri bildirimi |
| T6.1.2 | Communication feedback (ses/konuşma sinyalleri) | PRD ile uyumlu boyutlar |
| T6.1.3 | Confidence feedback (video/ses birleşimi) | Tutarlı tek skor/etiket |

### Story 6.2 — Skorlama

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T6.2.1 | Answer / Communication / Overall skorları tanımı ve hesaplama | Kullanıcı son ekranda görüyor |
| T6.2.2 | Skorların tekrarlanabilirliği (aynı girdi → aynı kural seti) | Regresyon için test notu |

---

## Epic 7 — Tekrar ve iyileştirme (MVP özellik 7)

**Amaç:** Cevabı yeniden deneme, iyileştirme önerileri, öğrenme döngüsü.

### Story 7.1 — Retry akışı

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T7.1.1 | Belirli soruda yeniden kayıt / yeni deneme | PRD: tekrar cevap imkanı |
| T7.1.2 | Retry sonrası skor/geri bildirim güncellemesi | Eski deneme saklama politikası net |

### Story 7.2 — İyileştirme önerileri

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T7.2.1 | AI’dan aksiyon maddeleri (kısa, uygulanabilir) | Kullanıcı sonraki adımı biliyor |

---

## Epic 8 — Analitik ve başarı metrikleri (PRD bölüm 9)

**Amaç:** Tamamlanan mülakat sayısı, süre, retry oranı, geri bildirim etkileşimi.

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T8.1 | Olay günlüğü (interview_started, interview_completed, retry_used, feedback_viewed) | Dashboard veya export için ham veri |
| T8.2 | Gizlilik: PII ve ses/video saklama politikası dokümante | KVKK/GDPR bilinci |

---

## Epic 9 — Test, kalite ve sürüm

| ID | Task | Kabul kriteri |
|----|------|----------------|
| T9.1 | Kritik akış E2E testi (giriş → CV → rol → kısa mülakat → sonuç) | Ana yol yeşil |
| T9.2 | İzin reddi, ağ kesintisi, boş CV senaryoları | Kullanıcı kırılmıyor |
| T9.3 | Store / dağıtım pipeline (iOS/Android) | Sürüm adayı üretilebiliyor |

---

## Bağımlılık özeti

- **Epic 3** → **Epic 2** (profil ve bağlam olmadan soru kalitesi düşer).
- **Epic 4** → **Epic 3** (soru/cevap döngüsü).
- **Epic 6** → **Epic 4** (ve kısmen **Epic 5** transcript/video girdileri).
- **Epic 7** → **Epic 6** (geri bildirim olmadan “iyileştirme” anlamsız).

---
