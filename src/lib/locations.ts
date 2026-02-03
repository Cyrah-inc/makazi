// Kenya towns by county - for filter dropdowns
export const getTowns = (county: string): string[] => {
  const townsByCounty: Record<string, string[]> = {
    'Nairobi': ['Westlands', 'Karen', 'Kilimani', 'Runda', 'CBD', 'Lavington', 'Kileleshwa', 'Parklands', 'South B', 'South C', 'Langata', 'Upperhill'],
    'Mombasa': ['Nyali', 'Bamburi', 'Shanzu', 'Tudor', 'Old Town', 'Likoni', 'Changamwe'],
    'Kiambu': ['Thika', 'Ruiru', 'Juja', 'Kiambu Town', 'Limuru', 'Kikuyu', 'Ruaka'],
    'Nakuru': ['Nakuru Town', 'Naivasha', 'Gilgil', 'Molo', 'Njoro'],
    'Kisumu': ['Kisumu Town', 'Mamboleo', 'Nyalenda', 'Milimani'],
    'Kajiado': ['Kitengela', 'Ongata Rongai', 'Ngong', 'Kajiado Town', 'Kiserian'],
    'Kwale': ['Diani', 'Ukunda', 'Msambweni', 'Kwale Town'],
    'Kilifi': ['Kilifi Town', 'Malindi', 'Watamu', 'Mtwapa'],
  };
  return townsByCounty[county] || [];
};
