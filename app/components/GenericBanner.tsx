export function GenericBanner({ content }: { content: string }) {
  return (
    <div className="p-4">
      <div className="mt-10 rounded-lg border border-purple-infoElementBorder bg-purple-infoElementBG px-4 py-6">
        <div className="flex flex-row items-center">
          <h2 className="text-md mb-0 text-left font-bold text-gray-900">{content}</h2>
        </div>

        {/* <div className="mt-4 flex-grow">
          <p className="text-left text-base leading-relaxed">{content.title}</p>
          <div className="border-divider mt-3 border-t">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={content.href}
              className="mx-auto mt-3 flex justify-center text-indigo-500"
            >
              {content.link}
            </a>
          </div>
        </div> */}
      </div>
    </div>
  );
}
