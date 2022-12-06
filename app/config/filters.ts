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

export const getStampProviderFilters = (filter: string | string[] | undefined): any => {
  let stampFilters: any = false;
  if (filter && typeof filter === "string" && filter.length && Object.keys(STAMP_FILTERS).includes(filter)) {
    stampFilters = STAMP_FILTERS[filter];
  }
  return stampFilters
};
