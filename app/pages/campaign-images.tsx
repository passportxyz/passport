import type { GetStaticProps, NextPage } from "next";
import path from "path";
import fs from "fs";

interface Props {
  images: string[];
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const dir = path.join(process.cwd(), "public", "assets", "campaigns");
  const files = fs.readdirSync(dir);
  const images = files
    .filter((f) => f.endsWith(".webp") && f !== "placeholder.webp")
    .map((f) => f.replace(".webp", ""))
    .sort();

  return { props: { images } };
};

const CampaignImages: NextPage<Props> = ({ images }) => (
  <div style={{ fontFamily: "sans-serif", padding: "2rem", background: "#1a1a2e", minHeight: "100vh", color: "#fff" }}>
    <h1 style={{ marginBottom: "0.5rem" }}>Campaign Images</h1>
    <p style={{ color: "#aaa", marginBottom: "2rem" }}>
      {images.length} available — use the name (without extension) in the admin
    </p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
      {images.map((name) => (
        <div key={name} style={{ textAlign: "center" }}>
          <img
            src={`/assets/campaigns/${name}.webp`}
            alt={name}
            style={{ width: "100%", borderRadius: "8px", aspectRatio: "570/786", objectFit: "cover" }}
          />
          <code style={{ display: "block", marginTop: "0.5rem", fontSize: "14px", color: "#4ABEFF" }}>{name}</code>
        </div>
      ))}
    </div>
  </div>
);

export default CampaignImages;
