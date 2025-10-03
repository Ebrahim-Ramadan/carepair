import { Service } from "@/lib/types"

export const serviceCategories = [
  {
    id: "protection",
    nameEn: "Vehicle Protection",
    nameAr: "حماية السيارة",
    icon: "shield-car"
  },
  {
    id: "polish",
    nameEn: "Polishing",
    nameAr: "تلميع",
    icon: "sparkles"
  },
  {
    id: "customization",
    nameEn: "Customization",
    nameAr: "تخصيص",
    icon: "palette"
  },
]


export const services: Service[] = [
    {
    id: "full-body-protection",
    nameEn: "Full Body Protection",
    nameAr: "حماية كاملة للسيارة",
    descriptionEn: "Complete vehicle body protection film to guard against scratches and damage.",
    descriptionAr: "حماية كاملة لهيكل السيارة من الخدوش والأضرار.",
    price: 50,
    category: "protection",
    estimatedHours: 8
  },
  {
    id: "hood-protection",
    nameEn: "Hood Protection",
    nameAr: "حماية كبوت",
    descriptionEn: "Protective film for the car hood to guard against scratches and damage.",
    descriptionAr: "طبقة حماية لكبوت السيارة ضد الخدوش والأضرار.",
    price: 70,
    category: "protection",
    estimatedHours: 1.5
  },
  {
    id: "quarter-protection",
    nameEn: "Quarter Panel Protection",
    nameAr: "حماية ربع",
    descriptionEn: "Protection film for vehicle quarter panels.",
    descriptionAr: "حماية لأجنحة السيارة الجانبية.",
    price: 120,
    category: "protection",
    estimatedHours: 2
  },
  {
    id: "matte-protection",
    nameEn: "Matte Protection",
    nameAr: "حماية مطفي",
    descriptionEn: "Matte finish protection film for a unique and durable look.",
    descriptionAr: "طبقة حماية مطفية لمظهر مميز وحماية قوية.",
    price: 800,
    category: "protection",
    estimatedHours: 6
  },
  {
    id: "black-matte-protection",
    nameEn: "Black Matte Protection",
    nameAr: "حماية أسود مطفي",
    descriptionEn: "Matte black protection film for a stylish appearance.",
    descriptionAr: "طبقة حماية باللون الأسود المطفي لمظهر أنيق.",
    price: 800,
    category: "protection",
    estimatedHours: 6
  },
  {
    id: "black-glossy-protection",
    nameEn: "Black Glossy Protection",
    nameAr: "حماية أسود لميع",
    descriptionEn: "Glossy black protection film for a shiny finish.",
    descriptionAr: "طبقة حماية باللون الأسود اللامع لمظهر لامع.",
    price: 800,
    category: "protection",
    estimatedHours: 6
  },
  {
    id: "blackout",
    nameEn: "Blackout (Trim Color Change)",
    nameAr: "بلاك اوت",
    descriptionEn: "Blackout treatment for vehicle trims and chrome delete.",
    descriptionAr: "معالجة بلاك اوت لتغيير لون الإطارات والزينة.",
    price: 450,
    category: "customization",
    estimatedHours: 2.5
  },
  {
    id: "caliper-painting",
    nameEn: "Caliper Painting",
    nameAr: "صبغ كليبرات",
    descriptionEn: "Professional painting for brake calipers in your choice of color.",
    descriptionAr: "صبغ احترافي لكليبرات الفرامل باللون الذي تختاره.",
    price: 100,
    category: "customization",
    estimatedHours: 2
  },
   {
    id: "diamond-flooring",
    nameEn: "Diamond Flooring",
    nameAr: "أرضية دياموند",
    descriptionEn: "Durable diamond flooring for added protection and style.",
    descriptionAr: "أرضية دياموند متينة للحماية والمظهر الأنيق.",
    price: 120,
    category: "customization",
    estimatedHours: 3
  },
  {
    id: "thermal-tint",
    nameEn: "Thermal Tint",
    nameAr: "تظليل حراري",
    descriptionEn: "High-quality American thermal tint for heat and UV protection.",
    descriptionAr: "تظليل حراري أمريكي عالي الجودة للحماية من الحرارة والأشعة.",
    price: 180,
    category: "protection",
    estimatedHours: 3
  },
  {
    id: "thermal-tint-vanet",
    nameEn: "Thermal Tint (Vanet)",
    nameAr: "تظليل حراري (وانيت)",
    descriptionEn: "Specialized thermal tint for pickup trucks (Vanet) for cooling and comfort.",
    descriptionAr: "تظليل حراري مخصص للوانيت لتقليل الحرارة وزيادة الراحة.",
    price: 280,
    category: "protection",
    estimatedHours: 3
  },
  {
    id: "windshield-protection",
    nameEn: "Windshield Protection",
    nameAr: "حماية جام",
    descriptionEn: "Protective film for vehicle glass to prevent scratches and cracks.",
    descriptionAr: "طبقة حماية لزجاج السيارة لمنع الخدوش والتشققات.",
    price: 30,
    category: "protection",
    estimatedHours: 1.5
  },
  {
    id: "exterior-polish",
    nameEn: "Exterior Polish",
    nameAr: "بوليش خارجي",
    descriptionEn: "Professional exterior polish for a glossy showroom finish.",
    descriptionAr: "تلميع خارجي احترافي لمظهر لامع مثل المعارض.",
    price: 30,
    category: "polish",
    estimatedHours: 2
  },
  {
    id: "interior-exterior-polish",
    nameEn: "Interior & Exterior Polish",
    nameAr: "تلميع داخلي + خارجي",
    descriptionEn: "Complete polishing for both vehicle interior and exterior.",
    descriptionAr: "تلميع شامل للسيارة داخليًا وخارجيًا.",
    price: 150,
    category: "polish",
    estimatedHours: 5
  },
  {
    id: "protection-removal",
    nameEn: "Protection Removal",
    nameAr: "إزالة حماية",
    descriptionEn: "Professional removal of existing protection films and wraps.",
    descriptionAr: "إزالة احترافية لطبقات الحماية أو التغليف الموجودة.",
    price: 50,
    category: "protection",
    estimatedHours: 2
  },
  {
    id: "full-color-change",
    nameEn: "Full Color Change Wrap",
    nameAr: "ستكر كامل (تغيير لون)",
    descriptionEn: "Full vehicle wrap for complete color change, customized per choice.",
    descriptionAr: "ستكر كامل لتغيير لون السيارة حسب اختيارك.",
    price: "حسب اللون",
    category: "customization",
    estimatedHours: 16
  }
]
