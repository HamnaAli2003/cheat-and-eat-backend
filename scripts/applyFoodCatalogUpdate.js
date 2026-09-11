import pg from "pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

/*
 * applyFoodCatalogUpdate.js
 * ---------------------------------------------------------------------------
 * One-shot catalog update driven by user instructions (image URLs, adds,
 * renames, removals, category restructure to: Curries / Fruits / Drinks /
 * Rice / Snacks). With --apply it writes a full backup then applies.
 * Without it, it only resolves names + probes images and prints a report.
 */

const APPLY = process.argv.includes("--apply");
const OUT = "reports/audit";
fs.mkdirSync(OUT, { recursive: true });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ------------------------------------------------------------------ IMAGES
const IMAGES = {
  "Aloo Chana": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6BowTqTO1RHZpH2v3YH3kdU_ovf3GWz_7S8cEjqS5fg&s=10",
  "Beef Chapli": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNsVKNcEx2bIg_Xm2s-uAbJ5Qm7xsPE0VKXdNfo-NK3Q&s=10",
  "Beef Haleem": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8oT7Y-EydYDJ-cVIXdapKLigUsiJmnajei1_fUmUhrg&s=10",
  "Beef Korma": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOb0F6sDDSi7OfTaXxCSvTBVbuZp8y3gLSwq2etDvMDg&s=10",
  "Beef Paye": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1anj2wOVUI-PWwCHOKM2D1citqSqEz8VoMngwPDXSHQ&s=10",
  "Beef Qeema": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEtoVB_Rc5xsXrI3AvKF8dbtl3PLzjK7TcRBHxmg6tJQ&s=10",
  "Beef Seekh Kebab": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGxnjyF3nh1oyfQSKLD-6uK7ttSQGQ1MzEWD8jY8Kxzg&s=10",
  "Bhindi Masala": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSUR5YVHvTer_uVNCs3SCuvfvi8FJZOs35iXAiRxYYtg&s=10",
  "Bihari Kebab": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-VxRfBCFNZyD6tkQgA2PmhxE19ijj21AUeRB3bZbAoQ&s=10",
  "Boiled Eggs": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtOlrC7Q-vumU9dlIbJbnnmPzclvP89kwjw6bOBb1x8g&s=10",
  "Bong Paye": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLBrcYGr2LKDTGX9f6rrsT-zbsaiaCUYV2aPUUHvez0A&s=10",
  "Chicken Changezi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_p8x7QBlSPoCetEeL9pSc5pavs9Wpb53Bm3O26LQmpg&s=10",
  "Chicken Curry": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAiaj-Pq24FtJamyPfXEwJf-u9ienqxUJzhG4X2a3FKA&s=10",
  "Chicken Chapli": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-uf4SoqboJPQmFP2sOUFex8F_wkNS1ME_kYEbb6H9aA&s=10",
  "Chicken Haleem": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7VbBuBnuUZN81W9ypqRdXxH2ZT5Oplc8uzs6fWORLng&s=10",
  "Chicken Jalfrezi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNebFTsma5ZuKJJPLmcc3lcYxASTmZXeKWvLZWqpaXhw&s=10",
  "Chicken Kofta": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlCaJnhZaDZTAr81QYTCAfngdRX7Py2zO83GvBajRoXg&s=10",
  "Chicken Korma": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUFNzLmLCQP1M0TsIU15kPUhxm9PPFufhtnf-cC6F95Q&s=10",
  "Chicken Koyla Karahi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDjMMsNFt7HVNk3LrhwQgbizod39aqm9CW46Cc8Qp20g&s=10",
  "Chicken Malai Boti": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRW0RM3z14fN-NpThUhvrOxMRMVkBeLpXDT8faTp_PYwQ&s=10",
  "Chicken Manchurian": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9Rq9UYCig6YSHmSWpzQ3xsyd5J_mx5121kekJI8JHtQ&s=10",
  "Chicken Rogan Josh": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRl8scGGQborGbpb0YTMJPQ4g1PU6lCxNYJoAOn3OVBuA&s=10",
  "Chicken Shinwari": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQz4rDxBPwg9WoZ6V5p-Vo3q89RW5vpkeS6gzrIO5rFwQ&s=10",
  "Chicken Yakhni": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwC8WJ2Up5XWtK2PVCjrws8JSeI-GUn6RyniqWEPkkrQ&s=10",
  "Daal Chana": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7bWYJES6tmFuV2g26LzrF0J98PtyBjIEoyrinwPqbFA&s=10",
  "Daal Mash": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwhXDSxZWOM6RWZz1dQuuQq82lpGDh3VfN3IlJxH55Ig&s=10",
  "Dampukht": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcEjFf4xtBgoOf7hkgfhRLkU4PITviqGcqC_uEMuFsgw&s=10",
  "Gola Kebab": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLoskYxi4kAusDrhoCKgDkplh4NOaZxFQ-dsZvxuTlAQ&s=10",
  "Gosht Karahi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSaE-y0jx3sa-ycH2Tn6gmRHbqclhyO_oCVK0DCgT-WQ&s=10",
  "Grilled Chicken Breast": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_4rb9TkYLQYrqnzS4ku7DXQPKqtvg0o2iZ9ieQjSnNQ&s=10",
  "Gulnar Kebab": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6g6MXMM74vNUMqJ4DcAfixOLsFODS0qPXWNOAMStQNQ&s=10",
  "Kachchi Biryani (Chicken)": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrTqO_MmeLxer2kQIosT6wwEqDBPC_fe34boJonJ8lPA&s=10",
  "Kaleji Masala": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwYaOY74VQSf-FJ0b1SbyKLbApRrwajWyTxdxiWpZ8-g&s=10",
  "Lamb Sajji": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRil8xzv99CtSdTqMgM8LpI4LM-y-9BSNQ5AQra-CWj5g&s=10",
  "Lamb Seekh": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToVKCU9m3nn7SclaxwcH2ZQkVM_4ocIcx1tzNON7NR-w&s=10",
  "Lamb Pulao": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1kiUqoAvsx793vFE8TiScfRDcwgem4EiWjqCH8rdhhA&s=10",
  "Phulka": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlS9RvdUXgmyB9TtsiRMIwHJk6zhs6ognq6NJzxftfgQ&s=10",
  "Sajji (Mutton)": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSBXlEAjU1gNbF4bjseXN5TB-E2BhD_Mq-xer4ETnaEQ&s=10",
  "Mutton Gushtaba": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfoxdAgOAeWRKkWlGFW8Ck2XdzAezw3L06E4OU1lmCJA&s=10",
  "Mutton Yakhni": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4JLyUtAqnHIhnLwgrXqCyNMhsA2qXXe-PEGkRjnaBbg&s=10",
  "Namkeen Gosht": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4NvESRzilAKLo-W-ADG_MP0aE_SiD9YUwHeXbYUEqqA&s=10",
  "Reshmi Karahi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkCWa_kZSCNbWXLtCJtLKK0jgrogexZgEBgUpMFUiIew&s=10",
  "Reshmi Kebab": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6XDS0qtcyxO9PtOktIcOCSU_AiEkDzxQeqQv90p0AZQ&s=10",
  "Reshmi Roll": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfWZYCRUMzFY4FB9RVnEK8bHP3VWuweTW3ZOWVxeuElw&s=10",
  "Shami Kebab": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Do8sXamQBH184r4Q7CfpCaRPK8ydZv6cUb7JkMJt_A&s=10",
  "Anjeer Halwa": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnNWI2mQ9qICsJBxu8Vlx3iYRFIYzHseyBAomMNVpfKQ&s",
  "Barfi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGd41Em5JpqiXRkVfVc_w2YVdeHRi_VnCXFB929O1BWg&s=10",
  "Besan Halwa": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-kAJyNE4DQzlAzXWG_NkNxj069qOoljDCwlP8-tKhJA&s=10",
  "Bohri Kheer": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbwcTPpAQi4hPA5lOz10fiPX6Gams1HyZbgOiIU-ALMg&s",
  "Boondi Laddu": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBZkggSXMtEgHbV80PSCV7J25WcC0AdTYDHoAOvFaq_Q&s=10",
  "Doodh Jalebi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqndD0BRQJ4kaoxiaE7FiUfqA0ZUOnRvyNabA0yAwoUw&s=10",
  "Doodh Pak": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx3ryNj_FbByUFkqmldosZyMaA-oqZDcxUoWov0iAMLQ&s=10",
  "Falooda": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTW5a8K5Rc7k2x_w73joAKaSvM-qidi2VBKCRSG6TdFUw&s=10",
  "Gajak": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTMTRPVrKZcB7BM2VNWNrIi6yD_ko84wo6E1NgvKMGgw&s=10",
  "Gur Halwa": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbCjFv9iBE5Gtve8yyeZR9d4CfquA2ShKHG6YfedPCLw&s=10",
  "Gur Wale Chawal": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF5Jr-ojyNGH8qD4O_l89xf6QbMu0-hEPVo7jAloZVvA&s=10",
  "Kesar Kulfi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdq_fykbcaZdsFbaqXwJix_YIG_TI4FlzrOQPrq0IvmQ&s=10",
  "Lachha": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6I_v1cvbJ8qK7avSmdXWMQBRHnCzl2RmI89JluIeBIA&s=10",
  "Seviyan": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAJXdL97Wam4pte3FrwR7C1eJNxY-QC5qzkCIZqNs61w&s=10",
  "Sohan Halwa": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRILxwA-7HPXxjMot4_JL0hVefWEaN2ivYy-irXAwYi3w&s=10",
  "Aloo Chaat": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc0Fo2c7ND1DsGeuH95zJqSEy8_RLxHwmCb5g7X48mzw&s=10",
  "Baingan Pakora": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIVwYM5fYPgpWqLiobHkHzx-F18CylPU0kOwb8UlPEeQ&s=10",
  "Bun Kebab": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTD7bziRyZiIeGgBSUfoGBp72RD7H7jYlm_MfjheFFLkA&s=10",
  "Chicken Roll": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5rNF1SXPCxR5OattbePAWz3RpHl8BaCQPEbs5CNBaEA&s=10",
  "Kadhi Pakora": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-eI11SosZ-12vlpPWcIHCR7eKjhnJF67MjlfAf-e0rA&s=10",
  "Malai Boti": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ24VNzXYfjVhzQdIYyfP8bn1d7bFEjpdIL-LUKuz8enQ&s=10",
  "Malai Boti Roll": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqWgZXXKvd9cr6v64-54qsMXbQf63fZB1EWl0o5fXFZw&s=10",
  "Pyaz Pakora": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMEmK4DfQOz5ocXRsBJ8Hue3E0W6hfX1duY6F28w6HOQ&s=10",
  "Bedmi Puri": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6shXVE1Ijrhic4hZ_qGr89Tt7K2NTyE7xBRFjXXVeHg&s=10",
  "Besan Roti": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEuaRdGKHD1CxRZtiROMFkmC0ZZnQtQnoyu28Yn5mviQ&s=10",
  "Butter Naan": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_-kkII3n6rFXgGNDyyutrHBYMH_wQdRl--URiL0aizg&s=10",
  "Chapati": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXfSt7RfkDWJ6WrO2JBgzic6RJSwOK85Qz-taUJULJPw&s=10",
  "Dry Fruit Naan": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_Pkf3hjaKvR1LDzlo5veBe6xwJkUNjlCGa8_5QinO0A&s=10",
  "Gobi Paratha": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAh2E_tAfo9Xwfo2PnRzHxgw5u5jvk9kzuS5Zt7epfSQ&s=10",
  "Mooli Paratha": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5_NoAip498a9ieO_mFP5CnBFPKJJWRUthyPWzcKyZmg&s=10",
  "Jowar Roti": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8dHMjj8xega6faXtQ-rCNyfk7JAaoXs6Fq4Of-7GlfQ&s=10",
  "Keema Naan": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKsM8LsXISN4TIXRHRvMqPcw_SCuZ487B7jIFJxJBHCA&s=10",
  "Lachha Paratha": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5aunq7QJjeqUG0k5iwlGOS2kAXF91ys7fcNh5hVb5Lw&s=10",
  "Makki Ki Roti": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk0Be_F81Q7uk-Nn481kOv6A2cPiP5_kpROhKit4bOPg&s=10",
  "Plain Paratha": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSk7tR2nwFSOzgVvWTRJYOF83wt9IB0diScuvkN5uzSVA&s=10",
  "Pyaz Paratha": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpa4UOGOXOrYm2mVSnB6RtOBZyeZ5Y_TTSIFuAAQ-Gag&s=10",
  "Aloo Bukhara Sharbat": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8-S2KbvbbXIp7gr2CbMUrJ_6bDWA2ALY-fStG-uu9Cw&s=10",
  "Apple Juice": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxUbEfZ5BXUtocxz2Wsd82jL2LwGyKF5CuxuNWYrvQ7g&s=10",
  "Apricot Juice": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8cKPbRYNfBeLArHwE-ItEkXvzPzLW4r5tmaYaIz5fFw&s=10",
  "Banana Shake": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_jf7h4R97gfE4L0ugFyubvBG5K3_zPVdDYFGqldPN_w&s=10",
  "Chai": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRhKV9yboxeyEl5KdOTwWeOfNzcCZD8ePW5uJibAZbJQ&s=10",
  "Doodh": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvUu05b9fsNco-NgvO7VTUmENWWFt8L-C4sGbtzxFWXg&s",
  "Fresh Lime Water": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQ_aIHNK3WsU4ACs6ZaYN0fquRweaG0gzUcUDtdPEFiw&s=10",
  "Guava Juice": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxfAtCaiP4eFtOMUEQPsKaIUMrlDS9SXVeToQyUnFPsg&s=10",
  "Gur Sharbat": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9SlAV5NXKlhZHFkUrJ7m4WOijujk37808FUOrxf1xgg&s=10",
  "Haldi Doodh": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVMODUjAqVfMrhLZV5kx8yUIH__UDb5VX95dRwmTm5GQ&s=10",
  "Jam-E-Shirin": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6yyFJZOyI2IQ5SCkRhXoXlsDk5A-UmdMW4SsYKoIKWQ&s=10",
  "Kanji": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4-zqAbjz9l9OY0knDY6Q9FEV-p_skWVcxqXnt8Yw7hw&s=10",
  "Peach Juice": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSGyZ7IVpKJe2cJ4reyFk--nAVlM7LVRBR_bZ7jLStuw&s=10",
  "Plum Juice": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqq7exe-eAnZAvR61y8yhcG4EdSTJQVWzljCDvQFu0iA&s=10",
  "Rabri Doodh": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYMjmdE1_u0b8MKF5fSt65WL30hlB0h3nbkyriyv7laQ&s=10",
  "Rooh Afza Milk": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkEXkgUEUWbjOQbBQy2c2ZUnvkiB_yN3xTcZa7CGO9CA&s=10",
  "Salted Lassi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSq7tSNjhb2djLskuc7W31BF3GZNu-QFAKTzt5pwqg6SQ&s=10",
  "Strawberry Shake": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4geYcvYgC7Ue1XW4dHq0Cr9SZTAexY7Ziv4o_Y6DByQ&s=10",
  "Sugarcane Juice": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8FNr6O-3UJEhns0VnJ40f3rSiCA-TiALeNeMTsmfYFw&s=10",
  "Aloo Pulao": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTE_4gD1mEHcJm31aAlMGT6qoGUVYGvZM1zNsb7N0Alwg&s=10",
  "Arvi Sabzi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsTV9A-mYHHJGaopr9zbX_oc90hdcZuybiHJgbq7imlA&s=10",
  "Beef Pulao": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlZhzmJrvI3acMpsAum4i56qHE-hG5g7aFpN44hJMc2A&s=10",
  "Bhindi Sabzi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg_YtsbhQlO2JBNAgNW9ov0SOzwWeRU6IYmAjNwTNBcQ&s=10",
  "Chana Pulao": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJHV6ztkEF9oUL3WGRkSGKtMwKNb2_VRN2Wi2U_TWQMA&s=10",
  "Fish Curry": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQhse28GakQ8vvZrj8grdRj_ENCsiYhciEx-MB3QRNGQ&s=10",
  "Karela Sabzi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS97RPlwrzPwYctxhfWAFX_Ao_o4FcnSONNQyjC2Ry5RA&s=10",
  "Tinday Sabzi": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR133RXZwW6Ej7yI1HGxdNeEKNlauFZnxEj0L-ptVaodw&s=10",
  "Shahi Zarda": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSavTTVeKh9prEz89NwBlCAtOsGO88mTbbgVNstvKIWvQ&s=10",
  "Almond": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhPJJbPqPJuzL0NHIThgYd_B6w-nTejIRTxUTkd4anSw&s=10",
  "Apple": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmcBuGtbymdovm5UYGtDLE2ZXeg-xTH_DPvP5BayjuVg&s=10",
  "Banana": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpDzVKtuWW7gfwqlUfrSTVFeSV8v27B37zVz40-vNa0A&s=10",
  "Apricot": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrJYyW-AXBGQ7NMJoJ5tEd8yRoi3XwxYwLPDh8JEl4Gg&s=10",
  "Falsa": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuKNtynvXzQkOddbD6dSxzkASwQmWlSt9Li_U7_srMKg&s=10",
  "Mango": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8SN-WRCBOwZNV-uJal7r5PPXjPzGmXqyYNArD2Mp51A&s",
  "Mulberry": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1-uaC8Hf2L5qxCOxSXUhEL3caMLULzv3Ougq0SiJJvA&s=10",
  "Muskmelon": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcKp36-vx5GkNdX3OCc23pfg140PIdKnlweIQpA8qwpg&s=10",
  "Guava": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLW4Em1RboFQ0d0osc0AhZFSPGQS78rUgOgzcoP3M6bg&s=10",
  "Orange": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlPBf2wG-cBHgJa0oiZfdMREhzTRgRNtA1OtQbaBvQ0g&s=10",
  "Peach": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEnkUxQGfTK1Ez_cuYifue6zVxs1Zx6zZYwNs-uxl8TA&s=10",
  "Pear": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPE1BS2HaSddW0rJfEjq83d9Cag995APQD5QHgi7QXXA&s=10",
  "Persimmon": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIDhXWnasua_szpT5Lkjt2XPaihswLWSSHW0GhmCBmRQ&s=10",
  "Walnut": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOhLdvw93RmVfTJcRdi3ZIoRyuCGHh9pP2wnjVlxV27g&s=10",
  "Watermelon": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlvD6FVBz-8JQsLcBMgP7jI0QS3lG3Tvm-VD__sQNoog&s=10",
  "Desi Omelette": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJP8ltfsQJKmiey4mHWdyDiv4F6P3iyBW7YoErnDpz_w&s=10",
  "Grape": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxTgJJ2bmpnEoTKjRVXS9qS2jDTpjrtDT5zbjZgFSH0Q&s=10",
};

// ---------------------------------------------------------------- RENAMES
const RENAMES = {
  Beguni: "Baingan Pakora",
  "Arvi Chawal": "Arvi Sabzi",
  "Bhindi Chawal": "Bhindi Sabzi",
};

// -------------------------------------------------------------- REMOVALS
const REMOVE = [
  // Curries
  "Korma", "Mutton Chapli", "Mutton Kadhai", "Mutton Kofta",
  "Tikka Masala Chicken", "Tawa Fry", "Wazwan Meat Dishes", "Rosh",
  "Landhi Rosh", "Mutton Sajji", "Shami Boti", "Shinwari Chicken", "Tabak Maaz",
  // Desserts
  "Aloo Bukhara Halwa", "Atta Halwa", "Cham Cham", "Chum Chum", "Double Ka Meetha",
  "Gujiya", "Halwa", "Imli Halwa", "Kamala Bhog", "Karadaiyan", "Kasata",
  "Khaja", "Khoa", "Khurma", "Kulfi", "Laddu", "Makhadi", "Malpua",
  "Malpua Rabri", "Mathura Peda", "Mawa", "Mawa Kachori", "Memoni Mithai", "Mithai",
  "Mohanthal", "Mysore Pak", "Papri", "Payasam", "Peda", "Sandesh", "Sohan Papdi",
  "Suji Ka Halwa", "Til Patti", "Wazwan Desserts",
  // Snacks
  "Aloo Samosa Chaat", "Beef Sajji", "Bhel Puri", "Chaat", "Chana Samosa",
  "Chana Tikki", "Chapli", "Chapli Roll", "Dahi Bhalla Chaat", "Dahi Puri",
  "Dahi Vada", "Ghugni", "Kachori Puri", "Palak Pakora", "Pakora", "Paneer Pakora",
  "Paneer Samosa", "Pani Puri", "Pani Puri Chaat", "Ragda Pattice", "Samosa Chaat",
  "Sev Puri", "Snack", "Sweet Samosa", "Tandoori Chicken", "Tikka Roll",
  "Wazwan Snacks",
  // Breads
  "Bread", "Dalhi Roti", "Dhebra", "Dosti Roti", "Gobi Mooli Paratha",
  "Karel", "Khasta Kachori", "Koki", "Malabar Paratha", "Missi Roti",
  "Mixed Veg Paratha", "Mughlai Paratha", "Naan Khush", "Naan Roz",
  "Paneer Naan", "Paneer Paratha", "Pyaaz Kachori", "Ragi Roti", "Rosh Naan",
  "Sajji Naan", "Sattu Paratha", "Sattu Roti", "Taftan", "Tandoori Roti",
  "Tikka Naan", "Tsot / Gyath", "Wazwan Bread",
  // Drinks
  "Apricot Drink", "Adrak Chai", "Black Tea", "Doodh Soda", "Elaichi Chai", "Fresh Lime Soda",
  "Fresh Orange Juice", "Imli Sharbat", "Jamun Sharbat", "Kahwa", "Kala Khatta", "Kesar Doodh",
  "Kesar Lassi", "Lassi Milkshake", "Lemon Soda", "Lemon Tea", "Mango Lassi",
  "Masala Chai", "Mixed Fruit Shake", "Mountain Tea", "Noon Chai", "Papaya Shake",
  "Rooh Afza", "Rooh Afza Lassi", "Rose Lassi", "Sheer Chai", "Sweet Lassi",
  "Thandai", "Wazwan Drinks",
  // Rice
  "Basmati Rice", "Biryani", "Bread Chawal", "Chana Chawal", "Degh Biryani",
  "Fish Chawal", "Gajar Pulao", "Gosht Chawal", "Hyderabadi Biryani",
  "Karahi Chawal", "Karela Chawal", "Keema Chawal", "Machli Pulao",
  "Mattar Chawal", "Memoni Biryani", "Moti Biryani", "Murgh Chawal",
  "Gosht Pulao", "Prawn Pulao", "Pulao", "Saag Chawal", "Seero", "Sela Rice",
  "Shami Kabab Chawal", "Shir Khurma Chawal", "Sweet Rice", "Tahari",
  "Tawa Pulao", "Tinday Chawal", "Zarda", "Haleem Chawal", "Kadhi Chawal",
  // Fruits / breakfast
  "Amla", "Dried Plum", "Honeydew", "Jujube", "Kinnow", "Mandarin", "Plum",
  "Quince", "Sapodilla", "Sweet Lime", "Tamarind", "Wood Apple",
  "Oatmeal (Milk)", "Poha (Flattened Rice)",
];

// -------------------------------------------------------------- DESCRIPTIONS
const DESCRIPTIONS = {
  "Aloo Chana": "Potato and chickpea curry simmered in a tangy tomato-onion masala.",
  "Beef Chapli": "Flat minced beef patty loaded with tomatoes, coriander and chapli spices, pan-fried.",
  "Beef Haleem": "Slow-cooked beef with cracked wheat, lentils and spices until thick and creamy.",
  "Beef Korma": "Tender braised beef in a mild, creamy onion-and-yogurt korma gravy.",
  "Beef Paye": "Beef trotters slow-cooked in a rich bone-marrow gravy with desi spices.",
  "Beef Qeema": "Minced beef cooked with onions, tomatoes and green chillies.",
  "Beef Seekh Kebab": "Minced beef kebabs seasoned with spices and grilled on skewers.",
  "Bhindi Masala": "Okra sautéed with onions, tomatoes and mild spices.",
  "Bihari Kebab": "Thin marinated beef patties seared on a flat iron with Bihari spices.",
  "Boiled Eggs": "Hard-boiled eggs — a simple, protein-rich snack.",
  "Bong Paye": "Aromatic beef trotters curry from the northern frontier, cooked with bone marrow and spices.",
  "Chicken Changezi": "Mughlai-style chicken in a rich tomato-onion gravy with whole spices.",
  "Chicken Curry": "Classic homestyle chicken curry in a spiced tomato-onion gravy.",
  "Chicken Chapli": "Spiced chicken patty inspired by chapli kebab, pan-fried.",
  "Chicken Haleem": "Chicken slow-cooked with cracked wheat and lentils into a thick stew.",
  "Chicken Jalfrezi": "Stir-fried chicken with capsicum, onions and a fiery masala.",
  "Chicken Kofta": "Chicken meatballs simmered in a rich onion-tomato gravy.",
  "Chicken Korma": "Chicken simmered in a creamy onion-yogurt korma gravy.",
  "Chicken Koyla Karahi": "Charcoal-smoked karahi chicken in a fresh tomato, ginger and green chilli gravy.",
  "Chicken Malai Boti": "Creamy yogurt-marinated chicken cooked in a mild, buttery masala.",
  "Chicken Manchurian": "Crispy fried chicken tossed in a sweet-sour Indo-Chinese sauce with capsicum.",
  "Chicken Rogan Josh": "Chicken in a rich red gravy perfumed with Kashmiri chillies and whole spices.",
  "Chicken Shinwari": "Simple Pashtun chicken curry with minimal oil, tomatoes and whole spices.",
  "Chicken Yakhni": "Fragrant chicken broth curry made with whole spices and slow-cooked stock.",
  "Daal Chana": "Split chickpeas (chana dal) cooked with a tarka of garlic, cumin and chillies.",
  "Daal Mash": "Whole black lentils slow-cooked with butter and spices.",
  "Dampukht": "Dum-cooked meat dish steamed slowly in a sealed pot with whole spices.",
  "Gola Kebab": "Round mince kebabs flavoured with mint and spices, seared golden.",
  "Gosht Karahi": "Lamb cooked in a wok with fresh tomatoes, ginger and green chillies.",
  "Grilled Chicken Breast": "Char-grilled chicken breast — lean and lightly spiced.",
  "Gulnar Kebab": "Seekh kebab wrapped in a grilled naan — an Islamabad street classic.",
  "Kachchi Biryani (Chicken)": "Raw-marinated chicken layered with fragrant rice and slow-cooked on dum.",
  "Kaleji Masala": "Beef liver stir-fried with onions, tomatoes and desi spices.",
  "Lamb Sajji": "Whole lamb roasted over coals with rock salt and ajwain — a Balochi speciality.",
  "Lamb Seekh": "Minced lamb kebabs seasoned with onion and spices, grilled on skewers.",
  "Lamb Pulao": "Fragrant lamb-and-rice pulao with whole spices and caramelised onions.",
  "Phulka": "Soft, puffed whole-wheat flatbread cooked on a tawa.",
  "Sajji (Mutton)": "Whole mutton roasted over coals with rock salt and ajwain.",
  "Mutton Gushtaba": "Soft lamb meatballs simmered in a creamy yogurt gravy — a Kashmiri wazwan dish.",
  "Mutton Yakhni": "Mild Kashmiri lamb curry in a spiced yogurt broth.",
  "Namkeen Gosht": "Slow-cooked, dry-spiced spicy lamb with caramelised onions.",
  "Reshmi Karahi": "Silky yogurt-cream karahi with tender meat and mild spices.",
  "Reshmi Roll": "Soft roomali wrap stuffed with silky chicken boti and chutney.",
  "Shami Kebab": "Minced beef patties bound with dal and spices, golden-fried.",
  "Anjeer Halwa": "Figs cooked with ghee and sugar into a rich, dense halwa.",
  "Barfi": "Dense milk-sugar sweet, often flavoured with cardamom and nuts.",
  "Besan Halwa": "Chickpea-flour halwa roasted in ghee with sugar and cardamom.",
  "Bohri Kheer": "Creamy milk pudding with vermicelli and nuts, a Bohri-favourite dessert.",
  "Boondi Laddu": "Round sweets made from tiny fried gram-flour pearls in sugar syrup.",
  "Doodh Jalebi": "Crisp jalebi soaked in saffron milk.",
  "Doodh Pak": "Rice-and-milk pudding slow-cooked with cardamom and nuts.",
  "Falooda": "Cold dessert layered with vermicelli, basil seeds, ice cream and rose syrup.",
  "Gajak": "Crisp sesame-jaggery brittle, a Punjabi winter classic.",
  "Gur Halwa": "Luxury jaggery halwa loaded with ghee and dry fruits.",
  "Gur Wale Chawal": "Sweet jaggery rice with raisins and nuts, served on Eid.",
  "Kesar Kulfi": "Dense, slow-set saffron milk kulfi.",
  "Lachha": "Layered milk-and-vermicelli dessert popular during Ramadan.",
  "Seviyan": "Sweet vermicelli pudding cooked in milk with cardamom and nuts.",
  "Sohan Halwa": "Dense semolina-and-nut halwa — a Multan classic.",
  "Aloo Chaat": "Boiled potato chaat tossed with chutneys, yoghurt and spices.",
  "Baingan Pakora": "Sliced aubergine dipped in gram-flour batter and deep-fried.",
  "Bun Kebab": "Spicy shami patty served in a toasted bun with chutney.",
  "Chicken Roll": "Paratha wrapped around spiced chicken boti with onion and chutney.",
  "Kadhi Pakora": "Gram-flour fritters simmered in a tangy yogurt curry.",
  "Malai Boti": "Creamy yogurt-marinated chicken boti, grilled and served with naan.",
  "Malai Boti Roll": "Grilled malai boti wrapped in a paratha with onion rings.",
  "Pyaz Pakora": "Onion fritters in seasoned gram-flour batter, fried crisp.",
  "Bedmi Puri": "Puri stuffed with spiced urad dal and deep-fried.",
  "Besan Roti": "Roti made with chickpea flour.",
  "Butter Naan": "Tandoori naan brushed with melted butter.",
  "Chapati": "Whole-wheat flatbread cooked on a tawa.",
  "Dry Fruit Naan": "Tandoori naan stuffed with dried fruits and nuts.",
  "Gobi Paratha": "Whole-wheat flatbread stuffed with spiced cauliflower.",
  "Mooli Paratha": "Whole-wheat flatbread stuffed with spiced white radish.",
  "Jowar Roti": "Flatbread made from sorghum flour.",
  "Keema Naan": "Tandoori naan stuffed with spiced minced meat.",
  "Lachha Paratha": "Flaky, layered pan-cooked flatbread.",
  "Makki Ki Roti": "Cornmeal flatbread, perfect with sarson ka saag.",
  "Plain Paratha": "Buttered whole-wheat flatbread roasted on a tawa.",
  "Pyaz Paratha": "Flatbread stuffed with a caramelised onion filling.",
  "Aloo Bukhara Sharbat": "Sweet-and-sour drink made from dried plums.",
  "Apple Juice": "Fresh-pressed apple juice.",
  "Apricot Juice": "Juice made from dried apricots — a Hunza speciality.",
  "Banana Shake": "Thick, creamy banana milk shake.",
  "Chai": "Traditional milky, spiced tea brewed with cardamom.",
  "Doodh": "Warm milk, plain or lightly sweetened.",
  "Fresh Lime Water": "Cooling fresh lime drink with mint.",
  "Guava Juice": "Juice pressed from ripe guavas.",
  "Gur Sharbat": "Refreshing jaggery drink with lemon.",
  "Haldi Doodh": "Golden turmeric milk.",
  "Jam-E-Shirin": "Cold, syrupy rose-flavoured drink served over ice.",
  "Kanji": "Fermented carrot and mustard-seed drink — a Punjabi winter classic.",
  "Peach Juice": "Juice pressed from ripe peaches.",
  "Plum Juice": "Juice pressed from fresh plums.",
  "Rabri Doodh": "Thickened, sweetened milk pudding drink.",
  "Rooh Afza Milk": "Rose-flavoured Rooh Afza syrup mixed with chilled milk.",
  "Salted Lassi": "Savoury yogurt shake with cumin and salt.",
  "Strawberry Shake": "Milkshake blended with fresh strawberries.",
  "Sugarcane Juice": "Fresh-pressed raw sugarcane juice with a squeeze of lemon.",
  "Aloo Pulao": "Fragrant rice pulao with potatoes and whole spices.",
  "Arvi Sabzi": "Colocasia root (arvi) cooked in a spiced onion-tomato gravy.",
  "Beef Pulao": "Aromatic rice cooked with tender beef and garam masala.",
  "Bhindi Sabzi": "Okra sautéed with onion, tomato and spices.",
  "Chana Pulao": "Rice pulao with chickpeas and caramelised onions.",
  "Shahi Zarda": "Sweet saffron rice packed with nuts, raisins and barfi.",
  "Almond": "Nutritious tree nut rich in vitamin E and healthy fats.",
  "Apple": "Crisp, juicy sweet fruit.",
  "Banana": "Energy-rich fruit packed with potassium.",
  "Apricot": "Sweet stone fruit — Hunza's famous harvest.",
  "Falsa": "Small tangy purple berries — a summer favourite.",
  "Mango": "The king of fruits — sweet and juicy.",
  "Mulberry": "Sweet, delicate berries prized across the north.",
  "Muskmelon": "Sweet melon with juicy orange flesh.",
  "Guava": "Juicy, vitamin-C-rich guava (amrood).",
  "Orange": "Refreshing, tangy citrus fruit.",
  "Peach": "Soft, juicy stone fruit.",
  "Pear": "Sweet, grainy-textured fruit.",
  "Persimmon": "Sweet, honey-like fruit popular in northern Pakistan.",
  "Walnut": "Omega-3-rich nuts grown in the northern valleys.",
  "Watermelon": "Hydrating summer fruit.",
  "Desi Omelette": "Spiced omelette with onion, tomato, chilli and coriander.",
  "Grape": "Sweet, juicy table grapes.",
};

// ----------------------------------------------------------------- Kepler-rate new foods
const ADDS = [
  {
    name: "Fish Curry", categorySlug: "curries", image: IMAGES["Fish Curry"],
    description: "Fish simmered in a rustic tomato-onion masala with ginger, garlic and green chillies.",
    base_calories: 210, base_protein: 21, base_carbs: 8, base_fat: 11, base_fiber: 0.5,
    serving_g: 180, serving_label: "1 typical serving", oil_g: 12, oil_kcal: 108,
    nutrition_basis: "Estimated recipe average; per 1 typical serving",
    urdu_name: "مچھلی سالن",
  },
  {
    name: "Karela Sabzi", categorySlug: "curries", image: IMAGES["Karela Sabzi"],
    description: "Bitter gourd slices sautéed with onions, tomatoes and desi spices — slightly crispy and savoury.",
    base_calories: 110, base_protein: 3.5, base_carbs: 12, base_fat: 6, base_fiber: 3,
    serving_g: 150, serving_label: "1 bowl (150g)", oil_g: 8, oil_kcal: 72,
    nutrition_basis: "Estimated recipe average; per 1 bowl (150g)",
    urdu_name: "کریلا سبزی",
  },
  {
    name: "Tinday Sabzi", categorySlug: "curries", image: IMAGES["Tinday Sabzi"],
    description: "Tinda (apple gourd) slow-cooked with tomatoes, green chillies and mild spices.",
    base_calories: 95, base_protein: 3, base_carbs: 8, base_fat: 5, base_fiber: 1.5,
    serving_g: 150, serving_label: "1 bowl (150g)", oil_g: 8, oil_kcal: 72,
    nutrition_basis: "Estimated recipe average; per 1 bowl (150g)",
    urdu_name: "ٹنڈے سبزی",
  },
];

// ---------------------------------------------------- CATEGORY RESTRUCTURE
const CAT_RENAMES = [
  { id: 26, name: "Curries", slug: "curries" },
  { id: 6, name: "Fruits", slug: "fruits" },
  { id: 30, name: "Snacks", slug: "snacks" },
];
const CAT_REMOVE_IDS = [5, 8, 9, 24, 27, 32];
const DEFAULT_MOVE_TO = 30; // Snacks
const SPECIAL_MOVES = { "Daal Chawal": 1, "Arvi Chawal": 26, "Bhindi Chawal": 26, "Kadhi Pakora": 26, "Kachchi Biryani (Chicken)": 1, "Boiled Eggs": 30, "Halwa Puri": 30 };

// ---------------------------------------------------------------- main
const cats = (await pool.query("SELECT id, name, slug FROM food_categories")).rows;
const foods = (await pool.query("SELECT * FROM foods")).rows;
const catById = Object.fromEntries(cats.map((c) => [Number(c.id), c]));
const byName = (n) => foods.filter((f) => f.name === n);

let unresolved = [];

// names that will legitimately exist only AFTER renames/adds
const EXPECT_NEW = new Set([
  ...Object.values(RENAMES),
  ...ADDS.map((a) => a.name),
]);

for (const n of Object.keys(IMAGES)) if (!byName(n).length && !EXPECT_NEW.has(n)) unresolved.push(`IMAGE : ${n}`);
for (const n of Object.keys(RENAMES)) if (!byName(n).length) unresolved.push(`RENAME: ${n}`);
for (const n of new Set(REMOVE)) if (!byName(n).length) unresolved.push(`REMOVE: ${n}`);
for (const n of Object.keys(DESCRIPTIONS)) if (!byName(n).length && !EXPECT_NEW.has(n)) unresolved.push(`DESC  : ${n}`);
for (const n of Object.keys(SPECIAL_MOVES)) if (!byName(n).length) unresolved.push(`MOVE  : ${n}`);

console.log("=== RESOLUTION ===");
console.log("categories:", cats.map((c) => `${c.id}:${c.name}`).join(", "));
console.log("image targets:", Object.keys(IMAGES).length);
console.log("remove targets:", new Set(REMOVE).size);
console.log("rename targets:", Object.entries(RENAMES).length);
console.log("adds:", ADDS.length);
if (unresolved.length) {
  console.log("UNRESOLVED (" + unresolved.length + "):");
  for (const u of unresolved) console.log("  " + u);
} else {
  console.log("All target names resolved OK.");
}

if (!APPLY) {
  await pool.end();
  process.exit(unresolved.length ? 1 : 0);
}

// ---------------------------------------------------------------- backup
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const backupFile = path.join(OUT, `catalog_update_backup.${ts}.json`);
fs.writeFileSync(backupFile, JSON.stringify({ cats, foods }, null, 2));
console.log("backup written:", backupFile);

// ---------------------------------------------------------------- apply
const client = await pool.connect();
try {
  await client.query("BEGIN");

  const catQuery = (id, name, slug) =>
    client.query(`UPDATE food_categories SET name = $1, slug = $2 WHERE id = $3`, [name, slug, id]);
  if (CAT_REMOVE_IDS.includes(26) === false) await catQuery(26, "Curries", "curries");
  await catQuery(6, "Fruits", "fruits");
  await catQuery(30, "Snacks", "snacks");

  // reassign foods out of removed categories
  for (const id of CAT_REMOVE_IDS) {
    const rows = foods.filter((f) => Number(f.category_id) === id);
    for (const f of rows) {
      const special = SPECIAL_MOVES[f.name];
      await client.query(`UPDATE foods SET category_id = $1 WHERE id = $2`, [special || DEFAULT_MOVE_TO, f.id]);
    }
  }
  for (const f of foods) {
    if (SPECIAL_MOVES[f.name]) {
      await client.query(`UPDATE foods SET category_id = $1 WHERE id = $2`, [SPECIAL_MOVES[f.name], f.id]);
    }
  }

  // delete removed categories
  for (const id of CAT_REMOVE_IDS) {
    await client.query(`DELETE FROM food_categories WHERE id = $1`, [id]);
  }

  // renames
  for (const [oldN, newN] of Object.entries(RENAMES)) {
    await client.query(`UPDATE foods SET name = $1, slug = $2 WHERE name = $3`, [newN, slugify(newN), oldN]);
  }

  // refresh rows so images/descriptions/deactivations run against new names
  const foodsFresh = (await client.query("SELECT * FROM foods")).rows;
  const byNameFresh = (n) => foodsFresh.filter((f) => f.name === n);

  // image assignments
  for (const [dbName, url] of Object.entries(IMAGES)) {
    const rows = byNameFresh(dbName);
    if (!rows.length) continue;
    for (const f of rows) {
      await client.query(
        `UPDATE foods SET image_url = $1, image_source = 'User-provided (Google Images)' WHERE id = $2`,
        [url, f.id]
      );
    }
  }

  // descriptions
  for (const [dbName, desc] of Object.entries(DESCRIPTIONS)) {
    for (const f of byNameFresh(dbName)) {
      await client.query(`UPDATE foods SET description = $1 WHERE id = $2`, [desc, f.id]);
    }
  }

  // deactivations
  for (const n of new Set(REMOVE)) {
    const rows = byNameFresh(n);
    for (const f of rows) {
      if (f.is_active) await client.query(`UPDATE foods SET is_active = false WHERE id = $1`, [f.id]);
    }
  }

  // adds
  const curriesId = 26; // renamed category "Curries"
  for (const a of ADDS) {
    await client.query(
      `INSERT INTO foods (category_id, name, slug, description, image_url, base_calories, base_protein, base_carbs, base_fat, base_fiber, is_active, urdu_name, nutrition_basis, serving_g, serving_label, oil_g, oil_kcal, image_source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12,$13,$14,$15,$16,'User-provided (Google Images)')`,
      [curriesId, a.name, slugify(a.name), a.description, a.image, a.base_calories, a.base_protein, a.base_carbs, a.base_fat, a.base_fiber, a.urdu_name, a.nutrition_basis, a.serving_g, a.serving_label, a.oil_g, a.oil_kcal]
    );
  }

  await client.query("COMMIT");
  console.log("APPLIED OK (transaction committed)");
} catch (err) {
  await client.query("ROLLBACK");
  console.error("APPLY FAILED, rolled back:", err.message);
  process.exitCode = 1;
} finally {
  client.release();
}

// ------------------------------------------------------------------ probes
if (!process.exitCode) {
  console.log("probing image URLs ...");
  const failures = [];
  let done = 0;
  for (const [dbName, url] of Object.entries(IMAGES)) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
      clearTimeout(t);
      if (!res.ok) failures.push({ dbName, url, status: res.status });
    } catch (e) {
      failures.push({ dbName, url, error: e.message });
    }
    done += 1;
    if (done % 20 === 0) console.log("  probed", done, "/", Object.keys(IMAGES).length);
  }
  fs.writeFileSync(path.join(OUT, `catalog_image_probe.${ts}.json`), JSON.stringify(failures, null, 2));
  if (failures.length) {
    console.log("IMAGE PROBE FAILURES (" + failures.length + "):");
    for (const f of failures) console.log("  ", f.dbName, "->", f.url || f.status || f.error);
  } else {
    console.log("All " + Object.keys(IMAGES).length + " images reachable.");
  }
}

await pool.end();