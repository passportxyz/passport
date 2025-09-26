// Keyword lists used to heuristically check email subjects for Amazon and Uber
// Keep these lists concise and high-signal to reduce false positives.

// Split into focused groups for readability and maintenance
const AMAZON_ORDER_KEYWORDS: string[] = [
  // English & core
  "order",
  "confirmation",
  // Germanic
  "bestellung", // de
  "bestelling", // nl
  "bestilling", // no
  "beställning", // sv
  "ordre", // da/fr
  // Romance
  "pedido", // es/pt
  "orden", // es
  "commande", // fr
  "ordine", // it
  "comanda", // ro
  "comandă", // ro (diacritics handled)
  "encomenda", // pt
  // Slavic
  "заказ", // ru
  "zamówienie", // pl
  "objednávka", // cs
  "narudžba", // hr/bs
  "поръчка", // bg
  "naročilo", // sl
  // Asian
  "注文", // ja
  "订单", // zh-cn
  "주문", // ko
  "आदेश", // hi
  "ऑर्डर", // hi (loan)
  "pesanan", // id
  "คำสั่งซื้อ", // th
  // Other
  "sipariş", // tr
  "παραγγελία", // el
  "הזמנה", // he
  "طلب", // ar
  "tilaus", // fi
  "rendelés", // hu
  // Useful purchase synonyms (high-signal)
  "purchase",
  "compra",
  "achat",
  "kauf",
  "acquisto",
  "aankoop",
  "receipt",
  "recibo",
  "reçu",
  "beleg",
  "quittung",
  "ricevuta",
  "bon",
];

const AMAZON_SHIPPING_KEYWORDS: string[] = [
  // Delivered
  "delivered",
  "entregado",
  "entregue",
  "livré",
  "consegnato",
  "geliefert",
  "доставлено",
  "配達", // match in 配達済み
  "送达", // match in 已送达
  "배송", // match in 배송완료
  // Shipped/Dispatched
  "shipped",
  "enviado",
  "expédié",
  "spedito",
  "versendet",
  "verstuurd",
  "wysłano",
  "отправлено",
  "発送", // match in 発送済み
  "发货", // match in 已发货
  // Generic sent
  "sent",
  "envoyé",
  "inviato",
  "gesandt",
  "verzonden",
  "poslano",
  "gönderildi",
  // Also commonly present in German order confirmations
  "bestellt",
];

export const AMAZON_SUBJECT_KEYWORDS: string[] = [...AMAZON_ORDER_KEYWORDS, ...AMAZON_SHIPPING_KEYWORDS];

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
