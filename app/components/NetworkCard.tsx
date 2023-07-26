export function NetworkCard() {
  return (
    <div className="border border-accent-2 bg-background-2 p-0">
      <div className="mx-4 my-2">
        <div className="flex w-full">
          <div className="mr-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24.7999 24.8002H28.7999V28.8002H24.7999V24.8002ZM14 24.8002H18V28.8002H14V24.8002ZM3.19995 24.8002H7.19995V28.8002H3.19995V24.8002ZM24.7999 14.0002H28.7999V18.0002H24.7999V14.0002ZM14 14.0002H18V18.0002H14V14.0002ZM3.19995 14.0002H7.19995V18.0002H3.19995V14.0002ZM24.7999 3.2002H28.7999V7.2002H24.7999V3.2002ZM14 3.2002H18V7.2002H14V3.2002ZM3.19995 3.2002H7.19995V7.2002H3.19995V3.2002Z"
                fill="var(--color-muted)"
              />
            </svg>
          </div>
          <div>
            <div className="flex w-full flex-col">
              <h1 className="text-lg text-color-1">Title</h1>
              <p className="mt-2 text-color-4 md:inline-block">Description</p>
            </div>
          </div>
        </div>
      </div>
      <button className="verify-btn center" data-testid="card-menu-button">
        <span className="mx-2 translate-y-[1px] text-muted">Coming Soon</span>
      </button>
    </div>
  );
}
