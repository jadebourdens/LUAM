// lib/category-sizes.ts

const CATEGORY_SIZES: Record<string, string[]> = {
  // Clothing & Shoes
  'women':             ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'women-clothes':     ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'women-shoes':       ['35', '36', '37', '38', '39', '40', '41', '42'],
  'women-bags':        ['One size'],
  'women-accessories': ['One size'],
  
  'men':               ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  'men-clothes':       ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  'men-shoes':         ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
  'men-bags':          ['One size'],
  'men-accessories':   ['One size'],
  
  'kids':              ['2', '3', '4', '5', '6', '7', '8', '9', '10'],
  'kids-clothes':      ['2', '3', '4', '5', '6', '7', '8', '9', '10'],
  'kids-shoes':        ['24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35'],
  'kids-bags':         ['One size'],
  'kids-games':        ['One size'],
  
  // Home & Art
  'home':              ['One size'],
  'home-textiles':     ['90x190 cm', '140x190 cm', '160x200 cm', '180x200 cm'],
  'home-curtains':     ['140x240 cm', '140x260 cm', '140x280 cm'],
  'home-furniture':    ['One size'],
  'home-lighting':     ['One size'],
  'home-kitchen':      ['One size'],
  'home-decor':        ['One size'],
  
  'art-collectibles':  ['Custom'],
}

export function getSizesForCategory(slug: string): string[] {
  return CATEGORY_SIZES[slug] ?? ['One size']
}