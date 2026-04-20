---
name: AI Coach Mobile plan
overview: "CV bazli kisisellestirilmis AI mulakat simulasyonu sunan mobil uygulama icin asamali urun ve teknik gelistirme plani. Kapsam: CV analizi, dinamik soru motoru, sesli/video mulakat, skor ve geri bildirim dongusu."
todos:
  - id: confirm-scope
    content: MVP kapsamini netlestir (Interview Coach core + mini learning modulu opsiyonel)
    status: pending
  - id: define-stack
    content: Mobil teknoloji yigini ve backend mimarisini kesinlestir
    status: pending
  - id: setup-foundation
    content: Proje iskeleti, auth, temel navigasyon ve izin akislarini kur
    status: pending
  - id: build-cv-analysis
    content: CV upload, parsing ve profil cikarim akisni gelistir
    status: pending
  - id: build-interview-engine
    content: Role + CV baglamli soru/follow-up motorunu gelistir
    status: pending
  - id: build-voice-video
    content: Ses/video cevap alma ve temel analiz pipeline'ini ekle
    status: pending
  - id: build-feedback-scoring
    content: Geri bildirim ve skorlama sistemini tamamla
    status: pending
  - id: build-retry-analytics
    content: Retry/iyilestirme dongusu ve temel analitik olaylarini ekle
    status: pending
  - id: release-mvp
    content: Test, kalite kontrolleri ve MVP release hazirligini tamamla
    status: pending
isProject: true
---

# AI Coach Mobile development plan

## Urun hedefi
Kullanicinin CV'si ve hedef rolune gore gercekci bir mulakat simulasyonu uretmek; ses/video sinyallerini de kullanarak icerik, iletisim ve ozguven odakli geri bildirim vermek.

## Varsayimlar
- Ilk surum mobil odakli (iOS/Android).
- Kullanici giris yapar, CV yukler, rol secer ve mulakati baslatir.
- AI servisleri (CV parsing, soru uretimi, feedback) backend uzerinden orkestre edilir.
- Video/ses analizleri MVP'de "basic" seviyede tutulur (yuksek dogruluk yerine calisir uctan uca akis oncelikli).

## MVP kapsaminda mutlaka olmasi gerekenler
- Kimlik dogrulama ve kullanici oturumu
- PDF CV yukleme ve AI ile profil cikarimi
- CV + role gore dinamik soru uretimi
- Follow-up soru akisi (en az 1 seviyeli)
- Sesli cevap alma + speech-to-text
- Temel video yakalama + basit non-verbal sinyal uretimi
- Cevap/iletisim/genel skorlar
- Her soru ve oturum sonunda aksiyon alinabilir geri bildirim
- Retry (tekrar cevap verme) ve sonuc guncelleme
- Temel urun metrikleri (baslatilan/tamamlanan mulakat, retry, feedback goruntuleme)

## Onerilen teknik mimari

- Mobil istemci:
  - React Native + Expo (alternatif: Flutter)
  - State: Zustand/Redux Toolkit
  - Data fetching: TanStack Query
- Backend:
  - FastAPI (Python)
  - Servis katmanlari: Auth, Interview Session, AI Orchestration, Analytics
- Veritabani:
  - PostgreSQL
- Depolama:
  - CV dosyalari ve gerekirse kisa sureli medya icin object storage
- AI entegrasyonlari:
  - CV parsing LLM pipeline
  - Question generation + follow-up engine
  - Feedback/scoring generation
  - Speech-to-text provider

## Onerilen veri modeli (cekirdek)

- users
- resumes
- candidate_profiles
- interview_sessions
- interview_questions
- interview_answers
- answer_transcripts
- voice_metrics
- video_metrics
- feedback_reports
- score_cards
- retry_attempts
- analytics_events

## Gelistirme fazlari

### Faz 1 - Temel iskelet ve auth
- Mobil proje kurulumu
- Ortam yapilandirmasi (dev/stage/prod)
- Giris/kayit/oturum yonetimi
- Kamera/mikrofon izin akislari
- Temel onboarding + ana navigasyon

### Faz 2 - CV analizi
- PDF upload
- Metin cikarimi
- Yapislandirilmis profil olusturma
- Kullaniciya profil ozeti gosterimi

### Faz 3 - Dinamik mulakat motoru
- Hedef rol secimi
- Ilk soru seti uretimi
- Session state yonetimi
- Follow-up soru mantigi
- Soru/cevap sirali akisi

### Faz 4 - Ses ve video pipeline
- Soru bazli ses kaydi
- STT transcript uretimi
- Kamera kaydi/onizleme
- Temel ses/video metriklerinin cikarimi

### Faz 5 - Feedback ve skorlama
- Content feedback
- Communication feedback
- Confidence feedback
- Answer / Communication / Overall score
- Sonuc ekrani ve ozet rapor

### Faz 6 - Retry, analitik ve release
- Tekrar cevap verme
- Skor ve feedback guncelleme stratejisi
- Event logging (started/completed/retry/feedback_viewed)
- Kritik akis testleri
- MVP release checklist

## Basari kriterleri (ilk teslim)
- Kullanici CV yukleyip hedef rol secerek mulakat baslatabiliyor.
- Sistem en az 5 soruluk, follow-up iceren bir oturumu tamamlatabiliyor.
- Sesli cevaplar transcript'e cevriliyor ve degerlendirmede kullaniliyor.
- Video/ses sinyalleri temel confidence/communication feedback'e dahil ediliyor.
- Kullanici sonunda skorlarini ve iyilestirme onerilerini goruyor.
- Retry sonrasi guncel performans farki kullaniciya gosteriliyor.

## MVP sonrasi (opsiyonel genisleme)
- Sirket bazli mulakat simulasyonlari
- Gelismis davranis analizi
- Coklu dil destegi
- Ogrenme patikasi (mini-LMS): kisa ders + quiz + interview prep roadmap
- Koclul paneli ve ilerleme dashboard'u
