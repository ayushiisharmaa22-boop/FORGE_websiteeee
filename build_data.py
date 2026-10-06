#!/usr/bin/env python3
"""
Forge data builder.

Reads every MSME .csv in raw/msme/ and every faculty .xlsx in raw/faculty/,
and writes data/data.js which the website loads.

To add more data later:
  1. Drop new files into raw/msme/ (Udyam district CSVs) or raw/faculty/ (faculty .xlsx)
  2. Run:  python build_data.py
  3. Commit data/data.js to GitHub

Needs: Python 3.8+ and openpyxl  (pip install openpyxl)
"""
import csv, json, re, sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("Please run:  pip install openpyxl")

ROOT = Path(__file__).parent
MSME_DIR = ROOT / "raw" / "msme"
FAC_DIR = ROOT / "raw" / "faculty"
OUT = ROOT / "data" / "data.js"
csv.field_size_limit(sys.maxsize)


def tidy_case(s: str) -> str:
    """ALL CAPS -> Title Case, leave mixed case alone."""
    s = re.sub(r"\s+", " ", s).strip()
    if s.isupper():
        s = s.title()
        s = re.sub(r"'S\b", "'s", s)
        s = s.replace("M/S", "M/S").replace("M/s", "M/S")
    return s


def clean_address(addr: str) -> str:
    """The registry repeats the same word 4-5 times. Keep each part once."""
    seen, out = set(), []
    for part in addr.split(","):
        key = re.sub(r"\s+", " ", part).strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(tidy_case(part))
    return ", ".join(out)


def load_msme():
    nic, districts, rows, seen = {}, [], [], set()
    files = sorted(MSME_DIR.glob("*.csv"))
    if not files:
        sys.exit(f"No CSV files found in {MSME_DIR}")
    for f in files:
        with open(f, encoding="utf-8-sig", errors="replace", newline="") as fh:
            for r in csv.DictReader(fh):
                name = tidy_case(r.get("EnterpriseName", ""))
                if not name:
                    continue
                dist = (r.get("District") or "").strip().title()
                if dist not in districts:
                    districts.append(dist)
                codes = []
                try:
                    for a in json.loads(r.get("Activities") or "[]"):
                        c = str(a.get("NIC5DigitId", "")).strip().zfill(5)
                        nic[c] = re.sub(r"\s+", " ", a.get("Description", "")).strip()
                        if c not in codes:
                            codes.append(c)
                except json.JSONDecodeError:
                    pass
                pin = (r.get("Pincode") or "").strip()
                year = (r.get("RegistrationDate") or "").strip().split("/")[-1]
                year = int(year) if year.isdigit() else 0
                addr = clean_address(r.get("CommunicationAddress", ""))
                key = (name.lower(), dist, pin, addr.lower(), tuple(codes))
                if key in seen:
                    continue
                seen.add(key)
                rows.append([name, districts.index(dist), pin, year, addr, codes])
        print(f"  read {f.name}")
    return districts, nic, rows


def find_col(header, *needles):
    for i, h in enumerate(header):
        h = (h or "").lower()
        if any(n in h for n in needles):
            return i
    return None


def load_faculty():
    out = []
    for f in sorted(FAC_DIR.glob("*.xlsx")):
        inst = re.sub(r"_?Faculty_?Directory", "", f.stem).replace("_", " ").strip()
        wb = openpyxl.load_workbook(f, read_only=True, data_only=True)
        for ws in wb.worksheets:
            rows = list(ws.iter_rows(values_only=True))
            if not rows:
                continue
            header = [str(c or "") for c in rows[0]]
            ci = {
                "name": find_col(header, "name"),
                "role": find_col(header, "designation"),
                "dept": find_col(header, "department", "domain"),
                "field": find_col(header, "field"),
                "spec": find_col(header, "specialization", "specialisation", "interest"),
                "email": find_col(header, "email"),
                "profile": find_col(header, "profile"),
            }
            if ci["name"] is None:
                continue  # e.g. the Notes sheet
            def g(r, k):
                i = ci[k]
                return str(r[i]).strip() if i is not None and i < len(r) and r[i] is not None else ""
            for r in rows[1:]:
                name = g(r, "name")
                if not name:
                    continue
                spec = g(r, "spec")
                if "does not specify" in spec.lower():
                    spec = ""
                out.append({
                    "name": name, "role": g(r, "role"), "dept": g(r, "dept"),
                    "field": g(r, "field"), "spec": spec, "email": g(r, "email"),
                    "profile": g(r, "profile"), "inst": inst,
                })
        print(f"  read {f.name}")
    return out


def main():
    print("MSME files:")
    districts, nic, biz = load_msme()
    print("Faculty files:")
    faculty = load_faculty()
    data = {"districts": districts, "nic": nic, "biz": biz, "faculty": faculty}
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text("window.FORGE_DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";", encoding="utf-8")
    print(f"\n{len(biz):,} businesses, {len(districts)} districts, {len(nic):,} activity codes, {len(faculty)} faculty")
    print(f"Wrote {OUT} ({OUT.stat().st_size/1e6:.1f} MB)")


if __name__ == "__main__":
    main()
