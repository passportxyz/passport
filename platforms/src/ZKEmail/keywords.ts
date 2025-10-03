// Keyword lists used to heuristically check email subjects for Amazon and Uber
// Comprehensive coverage for supported countries and future expansion

const AMAZON_SHIPPING_KEYWORDS: string[] = [
  // English (US, UK, Canada)
  "delivered",
  "delivery",
  "shipped",
  "shipping",
  "dispatch",
  "dispatched",
  "transit",

  // Spanish (Spain) / Portuguese
  "entrega",
  "entregado",
  "entregada",
  "entregue",
  "enviado",
  "enviada",
  "envio", // accents removed via normalization
  "remessa",
  "despachado",

  // French (Canada)
  "livraison",
  "livré",
  "livree",
  "expédié",
  "expedie",

  // German (Germany) / Dutch
  "lieferung",
  "geliefert",
  "versandt",
  "versendet",
  "unterwegs",
  "verzonden",
  "geleverd",
  "bestellt", // common in German order confirmations

  // Nordic / Finnish
  "leveret",
  "levert",
  "levererad",
  "afsendt",
  "sendt",
  "utsand",
  "toimitettu",
  "lähetetty",
  "lahetetty",

  // Italian / Romanian
  "consegna",
  "consegnato",
  "consegnata",
  "spedito",
  "spedita",
  "livrare",
  "livrat",
  "expediat",

  // Central & Eastern Europe
  "dostarczono",
  "dostarczenie",
  "wysłano",
  "wyslano",
  "doručeno",
  "doruceno",
  "odesláno",
  "odeslano",
  "dostavljeno",
  "isporučeno",
  "isporuceno",
  "isporuka",

  // Cyrillic (Russian, Ukrainian)
  "доставлено",
  "доставка",
  "отправлено",
  "впути",
  "відправлено",
  "водорозі",

  // Greek / Turkish
  "παραδόθηκε",
  "παράδοση",
  "απεστάλη",
  "teslim",
  "gönderildi",
  "kargolandı",

  // Arabic / Hebrew
  "تمالتوصيل",
  "تسليم",
  "تمالشحن",
  "قيدالتوصيل",
  "סופק",
  "נשלח",

  // Indic & SE Asia (India support)
  "वितरण",
  "वितरित",
  "डिलीवरी",
  "भेजागया",
  "रसतेमें",
  "ডেলিভারি",
  "পৌছেগেছে",
  "পাঠানোহয়েছে",
  "dikirim",
  "terkirim",
  "sedangkirim",
  "sudhdikirim",
  "đãngiao",
  "đanggiao",
  "đãgửi",
  "vậnchuyển",
  "จัดส่งแล้ว",
  "กำลังจัดส่ง",

  // East Asia (Japan support)
  "배송완료",
  "배송중",
  "발송됨",
  "配達済み",
  "配送中",
  "発送済み",
  "已送达",
  "已发货",
  "配送中",
  "正在派送",
];

export const AMAZON_SUBJECT_KEYWORDS: string[] = [...AMAZON_SHIPPING_KEYWORDS];

const UBER_RIDE_KEYWORDS: string[] = [
  // English
  "trip",
  "ride",
  "journey",
  // Spanish
  "viaje",
  "trayecto",
  "recorrido",
  // Portuguese
  "viagem",
  "corrida",
  "trajeto",
  // French
  "trajet",
  "course",
  "voyage",
  // German
  "fahrt",
  "reise",
  "strecke",
  // Italian
  "viaggio",
  "corsa",
  "tragitto",
  // Dutch
  "rit",
  "reis",
  "traject",
  // Polish
  "przejazd",
  "podróż",
  "kurs",
  // Russian
  "поездка",
  "маршрут",
  // Japanese
  "乗車",
  "トリップ",
  // Chinese
  "行程",
  "车程",
  // Korean
  "이동",
  "탑승",
  // Arabic
  "رحلة",
  "مشوار",
  // Turkish
  "yolculuk",
  "sürüş",
  // Indonesian
  "perjalanan",
  // Hindi
  "यात्रा",
  "सवारी",
];

const UBER_RECEIPT_KEYWORDS: string[] = [
  // Core receipt terms
  "receipt",
  "recibo",
  "reçu",
  "quittung",
  "ricevuta",
  "kvittering",
  "kwitancja",
  "квитанция",
  "領収書",
  "收据",
  "영수증",
  // Keep a few high-signal invoice/receipt variants used by Uber
  "rechnung",
  "beleg",
  "bon",
  // Fare can appear in English Uber subjects
  "fare",
];

export const UBER_SUBJECT_KEYWORDS: string[] = [...UBER_RIDE_KEYWORDS, ...UBER_RECEIPT_KEYWORDS];
