# Forge

Connects Manipur's registered MSMEs with faculty expertise.

* **Find businesses** (for faculty): search "wool", "garment", "chemical" and see which MSMEs do it, by district and sector.
* **Find faculty** (for MSMEs): search "machine learning", "IoT", "marketing" and get faculty with that specialisation.
  Searching a product (e.g. "garment") also suggests faculty whose expertise fits that sector.
* **Who can help** button on every business shows suggested faculty for its sector.
* Hindi words like *kapda, murgi, shahad, baans* also work.

## Put it online (GitHub Pages)

1. Create a new repository on GitHub and upload everything in this folder (keep the folder structure).
2. Repository **Settings > Pages > Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`.
3. Wait a minute. Your site is at `https://<your-username>.github.io/<repo-name>/`.

You can also just double-click `index.html` to open it on your computer.

## Add more data later

1. Put new MSME district CSVs (same columns as the Udyam files) in `raw/msme/`.
   Put new faculty `.xlsx` files (same columns as the NMIMS file) in `raw/faculty/`. The institution name is taken from the file name.
2. Run:
   ```
   pip install openpyxl
   python build_data.py
   ```
3. Upload the new `data/data.js` to GitHub (replace the old one).

## Change how businesses are matched to faculty

Open `assets/taxonomy.js`. Each sector lists which faculty expertise helps it, with a plain-language reason.
