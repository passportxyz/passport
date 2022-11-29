export const STAMP_FILTERS: any = {
  'bankless-academy': {
    Google: ["Account Name"],
    Ens: ["Account Name"],
    Poh: ["Account Name"],
    Twitter: ["Account Name"],
    Facebook: ["Account Name"],
    Brightid: ["Account Name"],
    Linkedin: ["Account Name"],
    Discord: ["Account Name"],
  }
};

export const getStampProviderFilters = (search: string): any => {
  let stampFilters: any = false;
  const queryString = new URLSearchParams(search);
  const filter = queryString.get("filter");
  if (filter && typeof filter === "string" && filter.length && Object.keys(STAMP_FILTERS).includes(filter)) {
    stampFilters = STAMP_FILTERS[filter];
  }
  return stampFilters
};
