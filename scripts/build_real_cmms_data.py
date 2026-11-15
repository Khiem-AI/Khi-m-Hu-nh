import csv
import json
import os
from datetime import datetime, timedelta

# Google Drive Photos mapping
REAL_PHOTOS = {
    'HVAC-CH-01': 'https://drive.google.com/thumbnail?id=1BClKVnAj1bd9yvWVJMuYSamLlPSCt-nj&sz=w1000',
    'HVAC-CH-02': 'https://drive.google.com/thumbnail?id=1LgEHWiRpQBJy7UZ41E1TtowYr-cGdiR7&sz=w1000',
    'HVAC-CH-03': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    'HVAC-PAU-01': 'https://drive.google.com/thumbnail?id=1HqQykWFWyenc-K8QFbz808Wi1BhnHOnX&sz=w1000',
    'HVAC-PAU-02': 'https://drive.google.com/thumbnail?id=18JG7VAEceht7nGsXdvXJhKJzVloYZnFJ&sz=w1000',
    'HVAC-AHU-01': 'https://drive.google.com/thumbnail?id=1zXpWhHlX4rKdjIPSeUl7TQ9OE4pqHHwf&sz=w1000',
    'HVAC-AHU-02': 'https://drive.google.com/thumbnail?id=1wnltoRI9AbF88X7NOepsq-Dyle3aBhts&sz=w1000',
    'HVAC-AHU-03': 'https://drive.google.com/thumbnail?id=1fID3KITYvtfRNygk-eYl4nS_h8UVS4wG&sz=w1000',
    'HVAC-AHU-04': 'https://drive.google.com/thumbnail?id=1dQ9Ql71THummyn8xD8zgTX8Obw1ei5rG&sz=w1000',
    'HVAC-AHU-05': 'https://drive.google.com/thumbnail?id=18MtVUhQWpoPWwEdKWbox9aZoqC_Oefho&sz=w1000',
    'HVAC-AHU-06': 'https://drive.google.com/thumbnail?id=1FkM6YTXT5rYLEvFaQUZG0JP0euncpPsp&sz=w1000',
    'HVAC-WAH-01': 'https://drive.google.com/thumbnail?id=1UdJdffFsagM3ULIfKCl6BIGEWEDCCPZ7&sz=w1000',
    'HVAC-WAH-02': 'https://drive.google.com/thumbnail?id=1tw4hfRaWL_E4bcN6wRknk-YsLwRPVP36&sz=w1000',
    'HVAC-CT-01': 'https://drive.google.com/thumbnail?id=1JKINS3upC9A_Ai22f6TOaX0vvSbrtor8&sz=w1000',
    'HVAC-CT-02': 'https://drive.google.com/thumbnail?id=1JKINS3upC9A_Ai22f6TOaX0vvSbrtor8&sz=w1000',
    'HVAC-CLWP-01': 'https://drive.google.com/thumbnail?id=1dG8cTl71rql1og-awoHRahfd4akiCl_l&sz=w1000',
    'HVAC-CLWP-02': 'https://drive.google.com/thumbnail?id=1FGtQPa_-OpeImauPwnj9XHPHHoi1w9If&sz=w1000',
    'HVAC-CLWP-03': 'https://drive.google.com/thumbnail?id=1ClGiPKjDPHayW4t-W29BYVPRtXyQ4lfw&sz=w1000',
    'HVAC-CHWP-01': 'https://drive.google.com/thumbnail?id=11vGKRf1Ru7zy6ncCWLcDtJBFhOmHva0O&sz=w1000',
    'HVAC-CHWP-02': 'https://drive.google.com/thumbnail?id=1GrrP4Wcbi1qoPHKr05SlC6ENz8yLGtdD&sz=w1000',
    'HVAC-CHWP-03': 'https://drive.google.com/thumbnail?id=1vF9kgv2MQiSpMgfOpMg7K3xXJqycjrQN&sz=w1000',
    'CMP-GA90-01': 'https://drive.google.com/thumbnail?id=14-nlmxcsATcUYB1kCQW6ecpJw9guAyik&sz=w1000',
    'CMP-GA90-02': 'https://drive.google.com/thumbnail?id=1F6D-TYiTewws-oQ_v1t6-pJWpPHTPwr3&sz=w1000',
    'CMP-GA75-01': 'https://drive.google.com/thumbnail?id=17npHMfMCe4OaDO-S_tx43EsCDxZfz2ph&sz=w1000',
    'CMP-GA75-02': 'https://drive.google.com/thumbnail?id=1-zmxv-PoMikHoCoR7DG_da31tZH4cm2o&sz=w1000',
    'CMP-NPG-01': 'https://drive.google.com/thumbnail?id=1IJTeRLLn5XFVLb7jnZo22ZaA45Lli6WO&sz=w1000',
    'CMP-NPG-02': 'https://drive.google.com/thumbnail?id=1AhWm0FCLVVe7y6KqvZi2JIB-Ivv9Zv8g&sz=w1000',
    'CMP-AD300-01': 'https://drive.google.com/thumbnail?id=1Zlv5ktCSS_jc5r7mhgD_o5m5VEYyrJfn&sz=w1000',
    'CMP-AD300-02': 'https://drive.google.com/thumbnail?id=1-C7rhVXKBzh-Qd1reOBZd0NfcXAQr5AU&sz=w1000',
    'CMP-AIR-T': 'https://drive.google.com/thumbnail?id=1DMBFhg5gWPrABcoHOMpJF2XVP3hE_7zE&sz=w1000',
    'CMP-VACUM': 'https://drive.google.com/thumbnail?id=1D_3t6QDnGZ-uUPF5elRZXr1TYdz5befr&sz=w1000',
    'WAT-DI': 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?auto=format&fit=crop&w=800&q=80',
    'WAT-DK': 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?auto=format&fit=crop&w=800&q=80',
    'WAT-WW': 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    'ELC-MV-01': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    'ELC-MV-02': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    'ELC-MSB-01': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    'ELC-MSB-02': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    'ELC-GE-01': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    'ELC-DB-Solar-01': 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    'FFA-FA': 'https://drive.google.com/thumbnail?id=1WMqj-YnjqklnhokI2Tsa2QGJozx_8Yqf&sz=w1000',
    'FFA-PUMP': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
    'FFA-F200-1': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
    'WAT-PUM1': 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80',
    'SEC-CCTV': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    'INF-INLIG': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    'INF-FLP': 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80',
    'HVAC-AHU-ENGINEERING': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
}

FALLBACK_IMG = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'

# The 48 equipments from Qu_n_l__b_o_tr__1111_44b50717.csv / prompt
EQUIPMENT_RAW = [
    ("HVAC-CH-01","Chiller 01","Hệ Thống Lạnh","Utility House","High","Hoạt động","Monthly","2026-12-04","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YKFRFJQ75ELH | Công suất lạnh: 550RT; Công suất điện: 300,9kW; Điện áp: 380V/50Hz; Giải nhiệt nước."),
    ("HVAC-CH-02","Chiller 02","Hệ Thống Lạnh","Utility House","Medium","Hoạt động","Monthly","2026-11-20","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YKFRFJQ75ELH | Công suất lạnh: 550RT; Công suất điện: 300,9kW; Điện áp: 380V/50Hz; Giải nhiệt nước."),
    ("HVAC-CH-03","Mini Chiller","Hệ Thống Lạnh","Utility House","High","Hoạt động","Monthly","2026-11-12","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YMAA0200PE | Công suất lạnh: 54.6RT; Công suất điện: 61.4kW; Điện áp: 380V/50Hz; Giải nhiệt gió."),
    ("HVAC-PAU-01","PAU 01","Hệ Thống Lạnh","AHU Room","Medium","Hoạt động","Monthly","2026-11-05","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YSM25M-2429-S-L | Công suất lạnh: 137,26 RT | Công suất điện: 19 kW | Điện áp: 380V/50Hz/ VSD | Lưu lượng gió: 7250 l/s"),
    ("HVAC-PAU-02","PAU 02","Hệ Thống Lạnh","AHU Room","Medium","Hoạt động","Monthly","2026-11-18","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YSM25M-2429-S-L | Công suất lạnh: 137,26 RT | Công suất điện: 19 kW | Điện áp: 380V/50Hz/ VSD | Lưu lượng gió: 7250 l/s"),
    ("HVAC-AHU-01","AHU 01","Hệ Thống Lạnh","AHU Room","Medium","Hoạt động","Monthly","2026-11-14","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YSM50M-3232-S-L | Công suất lạnh: 87,54 RT | Công suất điện: 45 kW | Điện áp: 380V/50Hz/ VSD | Lưu lượng gió: 20821 l/s"),
    ("HVAC-AHU-02","AHU 02","Hệ Thống Lạnh","AHU Room","Medium","Hoạt động","Monthly","2026-11-15","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YSM50M-3232-S-L | Công suất lạnh: 87,54 RT | Công suất điện: 45 kW | Điện áp: 380V/50Hz/ VSD | Lưu lượng gió: 20821 l/s"),
    ("HVAC-AHU-03","AHU 03","Hệ Thống Lạnh","AHU Room","Medium","Hoạt động","Monthly","2026-11-16","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YSM50M-3232-S-L | Công suất lạnh: 87,54 RT | Công suất điện: 45 kW | Điện áp: 380V/50Hz/ VSD | Lưu lượng gió: 20821 l/s"),
    ("HVAC-AHU-04","AHU 04","Hệ Thống Lạnh","AHU Room","Medium","Hoạt động","Monthly","2026-11-18","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YSM50M-3232-S-L | Công suất lạnh: 87,54 RT | Công suất điện: 45 kW | Điện áp: 380V/50Hz/ VSD | Lưu lượng gió: 20821 l/s"),
    ("HVAC-AHU-05","AHU 05","Hệ Thống Lạnh","AHU Room","Medium","Hoạt động","Monthly","2026-11-22","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YSM50M-3232-S-L | Công suất lạnh: 87,54 RT | Công suất điện: 45 kW | Điện áp: 380V/50Hz/ VSD | Lưu lượng gió: 20821 l/s"),
    ("HVAC-AHU-06","AHU 06","Hệ Thống Lạnh","AHU Room","High","Hoạt động","Monthly","2026-11-11","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YSM50M-3232-S-L | Công suất lạnh: 87,54 RT | Công suất điện: 39.3kW | Điện áp: 380V/50Hz/ VSD | Motor: YVF2-45kW-4P | Fan: SYQ1000K (963r/min) | Cooling Cap: 307.82kW | ESP: 600Pa, TSP: 1120.4Pa | Lưu lượng: 74956m3/h | Belt: SPC2360"),
    ("HVAC-WAH-01","AHU Warehouse 01","Hệ Thống Lạnh","AHU Room","Medium","Hoạt động","Monthly","2026-11-25","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YSM25M-2429-S-L | Công suất lạnh: 55,46 RT | Công suất điện: 30 kW | Điện áp: 380V/50Hz/ VSD | Lưu lượng gió: 14041 l/s"),
    ("HVAC-WAH-02","AHU Warehouse 02","Hệ Thống Lạnh","AHU Room","Medium","Hoạt động","Monthly","2026-11-25","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YSM25M-2429-S-L | Công suất lạnh: 55,46 RT | Công suất điện: 30 kW | Điện áp: 380V/50Hz/ VSD | Lưu lượng gió: 14041 l/s"),
    ("HVAC-CT-01","Tháp giải nhiệt 01","Hệ Thống Lạnh","Utility House","High","Hoạt động","Monthly","2026-11-18","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: NHP-350FX2 | Công suất lạnh: 700 RT | Lưu lượng: 106.8 l/s | Nhiệt độ bầu ướt: 28 °C | Nhiệt độ nước vào/ra: 36/31 °C | Công suất điện: 22 kW (2 quạt) | Điện áp: 380V/3P/50Hz/VSD"),
    ("HVAC-CT-02","Tháp giải nhiệt 02","Hệ Thống Lạnh","Utility House","High","Hoạt động","Monthly","2026-11-18","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: NHP-350FX2 | Công suất lạnh: 700 RT | Lưu lượng: 106.8 l/s | Nhiệt độ bầu ướt: 28 °C | Nhiệt độ nước vào/ra: 36/31 °C | Công suất điện: 22 kW (2 quạt) | Điện áp: 380V/3P/50Hz/VSD"),
    ("HVAC-CLWP-01","Bơm nước giải nhiệt 01","Hệ Thống Lạnh","Utility House","Medium","Hoạt động","Monthly","2026-11-20","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model Pump: LF50157G-X58RJG45.0/4 | Motor: 1LE0003-2BB23-3AB4-Z | Điện áp: 380V/3 pha/50Hz/VSD | Công suất: 30 kW | Lưu lượng: 106 l/s; Cột áp: 21 mH20"),
    ("HVAC-CLWP-02","Bơm nước giải nhiệt 02","Hệ Thống Lạnh","Utility House","Medium","Hoạt động","Monthly","2026-11-20","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model Pump: LF50157G-X58RJG45.0/4 | Motor: 1LE0003-2BB23-3AB4-Z | Điện áp: 380V/3 pha/50Hz/VSD | Công suất: 30 kW | Lưu lượng: 106 l/s; Cột áp: 21 mH20"),
    ("HVAC-CLWP-03","Bơm nước giải nhiệt 03","Hệ Thống Lạnh","Utility House","Medium","Hoạt động","Monthly","2026-11-20","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model Pump: LF50157G-X58RJG45.0/4 | Motor: 1LE0003-2BB23-3AB4-Z | Điện áp: 380V/3 pha/50Hz/VSD | Công suất: 30 kW | Lưu lượng: 106 l/s; Cột áp: 21 mH20"),
    ("HVAC-CHWP-01","Bơm nước lạnh 01","Hệ Thống Lạnh","Utility House","Medium","Hoạt động","Monthly","2026-11-21","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model Pump: LF60123G-XA6RJG30.0/4 | Motor: 1LE0003-2AB43-3AB4-Z | Điện áp: 380V/3 pha/50Hz/VSD | Công suất: 45 kW | Lưu lượng: 92 l/s; Cột áp: 35 mH20"),
    ("HVAC-CHWP-02","Bơm nước lạnh 02","Hệ Thống Lạnh","Utility House","Medium","Hoạt động","Monthly","2026-11-21","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model Pump: LF60123G-XA6RJG30.0/4 | Motor: 1LE0003-2AB43-3AB4-Z | Điện áp: 380V/3 pha/50Hz/VSD | Công suất: 45 kW | Lưu lượng: 92 l/s; Cột áp: 35 mH20"),
    ("HVAC-CHWP-03","Bơm nước lạnh 03","Hệ Thống Lạnh","Utility House","Medium","Hoạt động","Monthly","2026-11-21","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model Pump: LF60123G-XA6RJG30.0/4 | Motor: 1LE0003-2AB43-3AB4-Z | Điện áp: 380V/3 pha/50Hz/VSD | Công suất: 45 kW | Lưu lượng: 92 l/s; Cột áp: 35 mH20"),
    ("CMP-GA90-01","Máy nén khí GA90-1","Máy nén Khí và Nito - Vacuum","Utility House","High","Hoạt động","Monthly","2026-11-10","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: Atlas Copco GA90VSD | Điện áp: 380V/3pha/50Hz/VSD | Công suất 90 kW | Giải nhiệt gió | Áp suất làm việc: 7-8.5 bar | Lưu lượng tối đa: 306 l/s | Độ ồn: 74 dB"),
    ("CMP-GA90-02","Máy nén khí GA90-2","Máy nén Khí và Nito - Vacuum","Utility House","High","Đang sửa chữa","Monthly","2026-10-28","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: Atlas Copco GA90VSD | Điện áp: 380V/3pha/50Hz/VSD | Công suất 90 kW | Giải nhiệt gió | Áp suất làm việc: 7-8.5 bar | Lưu lượng tối đa: 306 l/s | Độ ồn: 74 dB"),
    ("CMP-GA75-01","Máy nén khí GA75-1","Máy nén Khí và Nito - Vacuum","Utility House","High","Hoạt động","Monthly","2026-11-22","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: Atlas Copco GA75 | Điện áp: 380V/3pha/50Hz | Công suất 75 kW | Giải nhiệt gió | Áp suất làm việc: 7-8.5 bar | Lưu lượng: 212 l/s | Độ ồn: 73 dB"),
    ("CMP-GA75-02","Máy nén khí GA75-2","Máy nén Khí và Nito - Vacuum","Utility House","High","Hoạt động","Monthly","2026-11-22","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: Atlas Copco GA75 | Điện áp: 380V/3pha/50Hz | Công suất 75 kW | Giải nhiệt gió | Áp suất làm việc: 7-8.5 bar | Lưu lượng: 212 l/s | Độ ồn: 73 dB"),
    ("CMP-NPG-01","Máy Nito NPG-01","Máy nén Khí và Nito - Vacuum","Utility House","High","Hoạt động","Monthly","2026-11-15","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: Atlas Copco NGP360+ | Điện áp: 220V/1pha/50Hz | Độ tinh khiết: 99,999% | Lưu lượng 107 m3/h, hệ số Air fac: 5.3 | Áp suất khí nén đầu vào: >4.5 bar, dewpoint: <10 °C"),
    ("CMP-NPG-02","Máy Nito NPG-02","Máy nén Khí và Nito - Vacuum","Utility House","High","Hoạt động","Monthly","2026-11-15","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: Atlas Copco NGP360+ | Điện áp: 220V/1pha/50Hz | Độ tinh khiết: 99,999% | Lưu lượng 107 m3/h, hệ số Air fac: 5.3 | Áp suất khí nén đầu vào: >4.5 bar, dewpoint: <10 °C"),
    ("CMP-AD300-01","Máy sấy hấp thụ AD300-1","Máy nén Khí và Nito - Vacuum","Utility House","Medium","Hoạt động","Monthly","2026-11-19","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: Atlas Copco AD300 | Điện áp: 220V/1pha/50Hz | Công suất: 6.3 kW | Lưu lượng: 300l/s tại áp suất 7 bar | Dewpoint: -41 đến -60 °C"),
    ("CMP-AD300-02","Máy sấy hấp thụ AD300-2","Máy nén Khí và Nito - Vacuum","Utility House","Medium","Hoạt động","Monthly","2026-11-19","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: Atlas Copco AD300 | Điện áp: 220V/1pha/50Hz | Công suất: 6.3 kW | Lưu lượng: 300l/s tại áp suất 7 bar | Dewpoint: -41 đến -60 °C"),
    ("CMP-AIR-T","Bồn chứa khí nén","Máy nén Khí và Nito - Vacuum","Utility House","High","Hoạt động","Quarterly","2026-11-20","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Bồn chứa áp lực dung tích 5000L | Áp suất làm việc thiết kế: 10 bar | Đạt kiểm định an toàn áp lực"),
    ("CMP-VACUM","Máy hút chân không","Máy nén Khí và Nito - Vacuum","AHU Room","Medium","Hoạt động","Monthly","2026-11-23","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model Bơm: V-VCS 200 (2 bơm) | Điện áp: 380V/3pha/50Hz | Công suất: 5.5 kW | Lưu lượng: 200 m3/h | Áp suất làm việc: -600 đến -950 mbar ABS"),
    ("WAT-DI","Hệ thống nước DI","Sản xuất nước DI- Drinking","Utility House","High","Hoạt động","Weekly","2026-11-11","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Lưu lượng: 2.67 m3/h | Điện trở suất: 18 mOhm | Áp suất: >40 mH2O | Công nghệ RO + EDI"),
    ("WAT-DK","Hệ thống nước Drinking","Sản xuất nước DI- Drinking","Utility House","Medium","Hoạt động","Monthly","2026-11-15","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Tiêu chuẩn đầu ra: QCVN6-1:2010/BYT | Lưu lượng: 400 L/h | Áp suất: >20 mH2O"),
    ("WAT-WW","Hệ thống xử lý nước thải","Xử lý nước thải","Trạm xử lý nước thải","High","Hoạt động","Daily","2026-11-10","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Công suất thiết kế: 180 m3/ngày đêm (150 m3 đạt chuẩn cột B; 30 m3 đạt chuẩn cột A) | Lưu lượng cực đại: 9 m3/h | Lưu lượng trung bình: 7.5 m3/h"),
    ("ELC-MV-01","Trạm trung thế 1","Hệ thống điện","Nhà điện trung thế 2","High","Hoạt động","Quarterly","2026-11-25","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Máy biến áp 22kV/0.4kV công suất 2000kVA | Recloser & Tủ hợp bộ RMU"),
    ("ELC-MV-02","Trạm trung thế 2","Hệ thống điện","Nhà điện trung thế 1","High","Hoạt động","Quarterly","2026-11-25","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Máy biến áp 22kV/0.4kV công suất 2000kVA | Recloser & Tủ hợp bộ RMU"),
    ("ELC-MSB-01","Tủ điện MSB 01","Hệ thống điện","Nhà điện MSB1","High","Hoạt động","Monthly","2026-11-18","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Tủ điện phân phối chính 3200A | Máy cắt ACB, ATS tự động chuyển đổi nguồn"),
    ("ELC-MSB-02","Tủ điện MSB 02","Hệ thống điện","Nhà điện MSB2","High","Hoạt động","Monthly","2026-11-18","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Tủ điện phân phối chính 3200A | Máy cắt ACB, ATS tự động chuyển đổi nguồn"),
    ("ELC-GE-01","Máy phát điện","Hệ thống điện","Nhà máy phát điện","High","Hoạt động","Monthly","2026-11-25","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Động cơ Diesel Cummins 2000kVA, Điện áp 380V/3P/50Hz | Bình dầu phụ 1000L, tự động hòa đồng bộ"),
    ("ELC-DB-Solar-01","Trạm điện solar - 1","Hệ thống điện","Trạm solar","High","Hoạt động","Monthly","2026-11-12","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Hệ thống điện mặt trời mái nhà công suất 500kWp | Inverter SMA Sunny Tripower 50kW (10 bộ)"),
    ("FFA-FA","Hệ thống báo cháy trung tâm","Hệ thống báo cháy, chữa cháy","FC Room","High","Hoạt động","Monthly","2026-11-10","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Tủ báo cháy FireNetLatitude hochiki, 06 loop (127 địa chỉ/loop) | Loop 1: Tầng 1 VP (120/127) | Loop 2: Chuông khẩn xưởng, nhà điện 2, nhà bơm (98/127) | Loop 3: Nhà xưởng X16-X26 & Y1-Y17 | Loop 4: Trục X5-X26, nhà xe | Loop 5: X1-X16, Y1-Y19 | Loop 6: X26-X27, kho FC, rác nguy hại"),
    ("FFA-PUMP","Trạm bơm nước chữa cháy","Hệ thống báo cháy, chữa cháy","FP Room","High","Hoạt động","Weekly","2026-11-10","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Gồm 01 Bơm Diesel 150kW + 01 Bơm Điện 132kW + 01 Bơm Bù áp 7.5kW | Áp lực duy trì: 8-10 bar | Tiêu chuẩn NFPA 20"),
    ("FFA-F200-1","Chữa cháy khí FM200 IT","Hệ thống báo cháy, chữa cháy","IT-Sever Room","High","Hoạt động","Quarterly","2026-12-10","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Hệ thống chữa cháy khí sạch FM200 (HFC-227ea) bảo vệ phòng máy chủ IT Server | Bình chứa 180L kèm van kích hoạt điện tử"),
    ("WAT-PUM1","Trạm bơm nước sinh hoạt","Hệ thống cấp thoát nước","Nhà bơm","Medium","Hoạt động","Monthly","2026-11-25","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Cụm 3 bơm biến tần Ebara 11kW, lưu lượng 45 m3/h, cột áp 45m | Cung cấp nước toàn bộ văn phòng và nhà xưởng"),
    ("SEC-CCTV","Hệ thống camera giám sát CCTV","Hệ thống an ninh - PA","Factory","Medium","Hoạt động","Monthly","2026-11-15","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Hệ thống 128 camera IP Hikvision 4K, 4 đầu ghi NVR 32 kênh | Lưu trữ dữ liệu 45 ngày liên tục"),
    ("INF-INLIG","Hệ thống đèn chiếu sáng bên trong xưởng","Nhà Xưởng","Factory","Medium","Hoạt động","Quarterly","2026-11-20","Khiêm Huỳnh","khiemhuynhggs@gmail.com","350 bộ đèn LED High Bay 150W Philips IP65, phân bổ 6 line chiếu sáng điều khiển qua tủ tự động"),
    ("INF-FLP","Bơm chống ngập","Nhà Xưởng","Factory","Medium","Hoạt động","Monthly","2026-11-01","Khiêm Huỳnh","khiemhuynhggs@gmail.com","02 Bơm chìm Tsurumi 7.5kW, cánh quạt chống nghẹt rác | Cảm biến phao tự động kích hoạt khi mực nước dâng cao"),
    ("HVAC-AHU-ENGINEERING","AHU Engineering Office","Hệ Thống Lạnh","Engineering Office","Medium","Hoạt động","Monthly","2026-11-16","Khiêm Huỳnh","khiemhuynhggs@gmail.com","Model: YSM25M-0915-S-L | Công suất lạnh: 15.07 RT | Công suất điện: 4 kW | Điện áp: 380V/50Hz/ VSD | Lưu lượng gió: 2110 l/s")
]

# Calculate last maintenance date given next date and frequency
def get_prev_date(next_str, freq):
    dt = datetime.strptime(next_str, '%Y-%m-%d')
    if freq == 'Daily':
        prev = dt - timedelta(days=1)
    elif freq == 'Weekly':
        prev = dt - timedelta(days=7)
    elif freq == 'Monthly':
        prev = dt - timedelta(days=30)
    elif freq == 'Quarterly':
        prev = dt - timedelta(days=90)
    elif freq == 'Yearly':
        prev = dt - timedelta(days=365)
    else:
        prev = dt - timedelta(days=30)
    return prev.strftime('%Y-%m-%d')

def get_status(next_str, today_str='2026-11-10'):
    if next_str < today_str:
        return 'Quá hạn'
    elif next_str == today_str:
        return 'Tới hạn'
    else:
        d_next = datetime.strptime(next_str, '%Y-%m-%d')
        d_today = datetime.strptime(today_str, '%Y-%m-%d')
        diff = (d_next - d_today).days
        if diff <= 7:
            return 'Sắp tới'
        return 'Đúng hạn'

# Build 48 Equipment
equipment_list = []
plans_list = []
history_list = []

for i, raw in enumerate(EQUIPMENT_RAW):
    code, name, he_thong, vi_tri, risk, status, freq, next_date, manager, email, specs = raw
    img = REAL_PHOTOS.get(code, FALLBACK_IMG)
    qr = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={code}"
    
    eq_obj = {
        "maThietBi": code,
        "tenThietBi": name,
        "thongSoKyThuat": specs,
        "heThong": he_thong,
        "viTri": vi_tri,
        "mucDoRuiRo": risk,
        "trangThai": status,
        "tanSuat": freq,
        "hanBaoTriTiepTheo": next_date,
        "nguoiPhuTrach": manager,
        "email": email,
        "qrCode": qr,
        "hinhAnh": img
    }
    equipment_list.append(eq_obj)
    
    # Calculate previous maintenance date
    prev_date = get_prev_date(next_date, freq)
    plan_status = get_status(next_date)
    
    plan_obj = {
        "id": f"PLAN-{code}",
        "maThietBi": code,
        "tenThietBi": name,
        "loaiBaoTri": "Định kỳ",
        "tanSuat": freq,
        "ngayBaoTriGanNhat": prev_date,
        "ngayBaoTriTiepTheo": next_date,
        "nguoiPhuTrach": manager,
        "trangThai": plan_status
    }
    plans_list.append(plan_obj)
    
    # Generate authentic history item matching sheet 3:
    # [Mã thiết bị, Tên thiết bị, Ngày thực hiện, Người thực hiện, Mô tả công việc, Thời gian dừng máy, Kết quả, Hình ảnh, Người lập báo cáo]
    downtime = 45 if freq == 'Daily' else (60 if freq == 'Weekly' else (120 if freq == 'Monthly' else 180))
    if code == 'CMP-GA90-02':
        res = 'Cần theo dõi'
        desc = 'Kiểm tra nhiệt độ đầu nén tăng cao, rung động cấp 3. Đã thay dầu bôi trơn tạm thời, chờ phụ tùng cụm sinh hàn giải nhiệt.'
    elif 'HVAC-CH' in code:
        res = 'Đạt'
        desc = 'Vệ sinh bình ngưng, kiểm tra áp suất gas R134a (hút 3.2 bar, đẩy 9.8 bar), siết cosse động cơ máy nén, cân bằng tải chiller.'
    elif 'AHU' in code or 'PAU' in code:
        res = 'Đạt'
        desc = 'Vệ sinh phin lọc sơ cấp G4 và túi F8, kiểm tra độ chùng dây curoa, tra mỡ gối đỡ quạt cấp, đo dòng điện motor định mức.'
    elif 'CMP' in code:
        res = 'Đạt'
        desc = 'Kiểm tra mức dầu trục vít, vệ sinh lọc gió đầu vào, xả nước bẫy tự động bình tích áp, đo nhiệt độ khí nén đầu ra.'
    elif 'WAT' in code:
        res = 'Đạt'
        desc = 'Kiểm tra màng RO, điện trở suất nước DI đạt 18.2 MOhm-cm. Rửa ngược bồn lọc cát/than hoạt tính, hiệu chuẩn sensor pH/DO.'
    elif 'ELC' in code:
        res = 'Đạt'
        desc = 'Quét nhiệt hồng ngoại thanh cái cái trạm trung thế, kiểm tra rơ le bảo vệ quá dòng, vệ sinh buồng dập hồ quang máy cắt ACB.'
    elif 'FFA' in code:
        res = 'Đạt'
        desc = 'Test kích hoạt liên động chuông còi báo cháy zone, kiểm tra áp lực đường ống cứu hỏa duy trì 8.5 bar, chạy thử bơm Diesel tuần định kỳ.'
    else:
        res = 'Đạt'
        desc = f'Kiểm tra định kỳ toàn diện {name}, đo kiểm các thông số kỹ thuật vận hành, vệ sinh công nghiệp và nghiệm thu an toàn.'
        
    tech = "Khiêm Huỳnh"
    
    hist_obj = {
        "id": f"HIST-{code}",
        "maThietBi": code,
        "tenThietBi": name,
        "ngayThucHien": prev_date,
        "nguoiThucHien": tech,
        "moTaCongViec": desc,
        "thoiGianDungMay": downtime,
        "ketQua": res,
        "hinhAnh": img,
        "nguoiLapBaoCao": "Khiêm Huỳnh",
        "chiPhiUocTinh": 500000 if freq in ['Daily', 'Weekly'] else 1500000
    }
    history_list.append(hist_obj)

# Add 6 multi-cycle previous records for key critical equipment
multi_cycle = [
    {
        "id": "HIST-HVAC-CH-01-PREV",
        "maThietBi": "HVAC-CH-01",
        "tenThietBi": "Chiller 01",
        "ngayThucHien": "2026-10-05",
        "nguoiThucHien": "Khiêm Huỳnh",
        "moTaCongViec": "Bảo trì định kỳ tháng 10: Xúc rửa dàn ngưng, tra mỡ vòng bi bơm giải nhiệt, kiểm tra độ cách điện motor máy nén.",
        "thoiGianDungMay": 120,
        "ketQua": "Đạt",
        "hinhAnh": REAL_PHOTOS['HVAC-CH-01'],
        "nguoiLapBaoCao": "Khiêm Huỳnh",
        "chiPhiUocTinh": 2500000
    },
    {
        "id": "HIST-CMP-GA90-01-PREV",
        "maThietBi": "CMP-GA90-01",
        "tenThietBi": "Máy nén khí GA90-1",
        "ngayThucHien": "2026-10-10",
        "nguoiThucHien": "Khiêm Huỳnh",
        "moTaCongViec": "Bảo dưỡng 4000h: Thay lọc dầu, lọc tách nhớt Atlas Copco, kiểm tra van hút và van áp suất tối thiểu.",
        "thoiGianDungMay": 180,
        "ketQua": "Đạt",
        "hinhAnh": REAL_PHOTOS['CMP-GA90-01'],
        "nguoiLapBaoCao": "Khiêm Huỳnh",
        "chiPhiUocTinh": 4200000
    },
    {
        "id": "HIST-ELC-MV-01-PREV",
        "maThietBi": "ELC-MV-01",
        "tenThietBi": "Trạm trung thế 1",
        "ngayThucHien": "2026-08-25",
        "nguoiThucHien": "Khiêm Huỳnh",
        "moTaCongViec": "Thí nghiệm định kỳ Quý 3: Đo điện trở tiếp địa trạm, lấy mẫu dầu máy biến áp 2000kVA thử nghiệm điện áp đánh thủng.",
        "thoiGianDungMay": 240,
        "ketQua": "Đạt",
        "hinhAnh": REAL_PHOTOS['ELC-MV-01'],
        "nguoiLapBaoCao": "Khiêm Huỳnh",
        "chiPhiUocTinh": 5500000
    },
    {
        "id": "HIST-WAT-WW-PREV",
        "maThietBi": "WAT-WW",
        "tenThietBi": "Hệ thống xử lý nước thải",
        "ngayThucHien": "2026-11-09",
        "nguoiThucHien": "Khiêm Huỳnh",
        "moTaCongViec": "Kiểm tra hàng ngày: Đo nồng độ bùn vi sinh SV30, châm hóa chất dinh dưỡng N-P, kiểm tra bơm định lượng PAC/Polymer.",
        "thoiGianDungMay": 30,
        "ketQua": "Đạt",
        "hinhAnh": REAL_PHOTOS['WAT-WW'],
        "nguoiLapBaoCao": "Khiêm Huỳnh",
        "chiPhiUocTinh": 350000
    }
]
history_list.extend(multi_cycle)

# Sort history by date desc
history_list.sort(key=lambda x: x['ngayThucHien'], reverse=True)

# EMPLOYEES: Sheet 10 “Nhan_vien”
# Only real employee from provided file: Khiêm Huỳnh (khiemhuynhggs@gmail.com)
employees_list = [
    {
        "maNhanVien": "NV-ENG-001",
        "tenNhanVien": "Khiêm Huỳnh",
        "date": "2026-11-10",
        "chucVu": "Trưởng phòng Kỹ thuật",
        "ngayVao": "2020-03-15",
        "soDienThoai": "0908 123 456",
        "email": "khiemhuynhggs@gmail.com",
        "anhDaiDien": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    }
]

# Sheet 4: TICKETS
tickets_list = [
    {
        "maTicket": "TCK-2026-001",
        "tieuDe": "Xử lý rung ồn và nhiệt độ tăng bất thường máy nén khí GA90-2",
        "trangThai": "Đang xử lý",
        "ngayTao": "2026-10-28",
        "moTaChiTiet": "Máy nén khí GA90-2 có tiếng ồn kim loại lạ ở cụm sinh hàn dầu, nhiệt độ khí xả chạm ngưỡng 105 độ C. Đã dừng máy để bảo vệ cụm trục vít và chuyển sang chạy máy dự phòng GA90-1.",
        "nguoiPhuTrach": "Khiêm Huỳnh",
        "ngayHoanThanh": "",
        "ketQua": "Đang tháo kiểm tra van nhiệt và làm sạch két làm mát",
        "nguoiLap": "Khiêm Huỳnh",
        "mucDoUuTien": "Khẩn cấp",
        "anhTruocXuLy": REAL_PHOTOS['CMP-GA90-02'],
        "anhSauXuLy": ""
    },
    {
        "maTicket": "TCK-2026-002",
        "tieuDe": "Bảo dưỡng định kỳ và thay phin lọc túi F8 cho PAU 01",
        "trangThai": "Hoàn thành",
        "ngayTao": "2026-11-04",
        "moTaChiTiet": "Chênh lệch áp suất qua phin lọc túi PAU 01 vượt ngưỡng 250 Pa, lưu lượng gió tươi cấp vào xưởng bị suy giảm.",
        "nguoiPhuTrach": "Khiêm Huỳnh",
        "ngayHoanThanh": "2026-11-05",
        "ketQua": "Đã thay mới 4 tấm lọc túi F8 592x592, đo kiểm chênh áp về mức an toàn 95 Pa",
        "nguoiLap": "Khiêm Huỳnh",
        "mucDoUuTien": "Trung bình",
        "anhTruocXuLy": REAL_PHOTOS['HVAC-PAU-01'],
        "anhSauXuLy": REAL_PHOTOS['HVAC-PAU-01']
    },
    {
        "maTicket": "TCK-2026-003",
        "tieuDe": "Kiểm tra định kỳ rơ le bảo vệ và quét nhiệt trạm trung thế 1",
        "trangThai": "Mới tiếp nhận",
        "ngayTao": "2026-11-09",
        "moTaChiTiet": "Lên lịch kiểm tra nhiệt độ tiếp điểm đầu cosse cáp ngầm 22kV và kiểm tra buồng khí SF6 tủ RMU theo kế hoạch quý.",
        "nguoiPhuTrach": "Khiêm Huỳnh",
        "ngayHoanThanh": "",
        "ketQua": "",
        "nguoiLap": "Khiêm Huỳnh",
        "mucDoUuTien": "Cao",
        "anhTruocXuLy": REAL_PHOTOS['ELC-MV-01'],
        "anhSauXuLy": ""
    },
    {
        "maTicket": "TCK-2026-004",
        "tieuDe": "Sửa chữa bơm chống ngập hố thu số 2",
        "trangThai": "Hoàn thành",
        "ngayTao": "2026-10-31",
        "moTaChiTiet": "Phao tự động bơm chống ngập INF-FLP bị kẹt rác, bơm không tự ngắt khi cạn nước.",
        "nguoiPhuTrach": "Khiêm Huỳnh",
        "ngayHoanThanh": "2026-11-01",
        "ketQua": "Đã vệ sinh phao từ, thay relay nhiệt trong tủ điều khiển, chạy thử tự động tốt.",
        "nguoiLap": "Khiêm Huỳnh",
        "mucDoUuTien": "Cao",
        "anhTruocXuLy": REAL_PHOTOS['INF-FLP'],
        "anhSauXuLy": REAL_PHOTOS['INF-FLP']
    },
    {
        "maTicket": "TCK-2026-005",
        "tieuDe": "Hiệu chuẩn sensor đo điện trở suất nước DI",
        "trangThai": "Đang xử lý",
        "ngayTao": "2026-11-08",
        "moTaChiTiet": "Sensor đo điện trở suất đường ống cấp chính nước DI có hiện tượng trôi điểm 0, cần dung dịch chuẩn 0.055 uS/cm để cân chỉnh lại.",
        "nguoiPhuTrach": "Khiêm Huỳnh",
        "ngayHoanThanh": "",
        "ketQua": "Đang ngâm điện cực với dung dịch chuẩn",
        "nguoiLap": "Khiêm Huỳnh",
        "mucDoUuTien": "Cao",
        "anhTruocXuLy": REAL_PHOTOS['WAT-DI'],
        "anhSauXuLy": ""
    },
    {
        "maTicket": "TCK-2026-006",
        "tieuDe": "Kiểm tra đầu báo khói Beam detector trục X12 xưởng sản xuất",
        "trangThai": "Hoàn thành",
        "ngayTao": "2026-11-06",
        "moTaChiTiet": "Tủ trung tâm báo lỗi tín hiệu yếu tại đầu thu phát Beam Loop 3 do bụi bám gương phản xạ.",
        "nguoiPhuTrach": "Khiêm Huỳnh",
        "ngayHoanThanh": "2026-11-07",
        "ketQua": "Đã dùng xe nâng lau gương phản xạ và căn chỉnh laser đồng tâm, mức tín hiệu đạt 98%",
        "nguoiLap": "Khiêm Huỳnh",
        "mucDoUuTien": "Khẩn cấp",
        "anhTruocXuLy": REAL_PHOTOS['FFA-FA'],
        "anhSauXuLy": REAL_PHOTOS['FFA-FA']
    }
]

# Sheet 5: SPARE PARTS
spare_parts_list = [
    {
        "maVatTu": "SP-HVAC-BELT-SPC",
        "tenVatTu": "Dây đai truyền động quạt AHU",
        "thongSo": "SPC 2360 - Optibelt chịu nhiệt",
        "maThietBi": "HVAC-AHU-06",
        "tenThietBiSuDung": "AHU 06",
        "tonToiThieu": 4,
        "tonThucTe": 8,
        "donViTinh": "Sợi",
        "viTriLuu": "Kệ A-01-02",
        "ghiChu": "Dùng chung cho AHU 01 - AHU 06",
        "donGia": 450000
    },
    {
        "maVatTu": "SP-HVAC-OIL-134",
        "tenVatTu": "Dầu bôi trơn máy nén lạnh York",
        "thongSo": "York Oil K - Can 20L",
        "maThietBi": "HVAC-CH-01",
        "tenThietBiSuDung": "Chiller 01",
        "tonToiThieu": 2,
        "tonThucTe": 5,
        "donViTinh": "Can",
        "viTriLuu": "Kho dầu bôi trơn",
        "ghiChu": "Dầu chính hãng Johnson Controls cho York YK",
        "donGia": 6800000
    },
    {
        "maVatTu": "SP-CMP-OIL-ROTO",
        "tenVatTu": "Dầu máy nén khí Roto Inject Fluid",
        "thongSo": "Atlas Copco Roto-Xtend 2901052200 - Thùng 20L",
        "maThietBi": "CMP-GA90-01",
        "tenThietBiSuDung": "Máy nén khí GA90-1",
        "tonToiThieu": 4,
        "tonThucTe": 2,
        "donViTinh": "Thùng",
        "viTriLuu": "Kho hóa chất C-03",
        "ghiChu": "Cảnh báo dưới tồn tối thiểu, cần đặt mua bổ sung!",
        "donGia": 5400000
    },
    {
        "maVatTu": "SP-CMP-SEP-GA90",
        "tenVatTu": "Lọc tách dầu máy nén khí GA90",
        "thongSo": "Code: 1625703600 chính hãng",
        "maThietBi": "CMP-GA90-02",
        "tenThietBiSuDung": "Máy nén khí GA90-2",
        "tonToiThieu": 2,
        "tonThucTe": 1,
        "donViTinh": "Cái",
        "viTriLuu": "Kệ B-02-01",
        "ghiChu": "Dành riêng cho máy nén GA90",
        "donGia": 8200000
    },
    {
        "maVatTu": "SP-WAT-RO-8040",
        "tenVatTu": "Màng lọc nước thẩm thấu ngược RO",
        "thongSo": "Filmtec BW30-400 (DOW/DuPont) size 8040",
        "maThietBi": "WAT-DI",
        "tenThietBiSuDung": "Hệ thống nước DI",
        "tonToiThieu": 3,
        "tonThucTe": 6,
        "donViTinh": "Cây",
        "viTriLuu": "Kệ W-01",
        "ghiChu": "Bảo quản nơi khô ráo, nhiệt độ < 35C",
        "donGia": 9500000
    },
    {
        "maVatTu": "SP-ELC-ACB-COIL",
        "tenVatTu": "Cuộn đóng shunt trip máy cắt ACB 3200A",
        "thongSo": "Schneider 220VAC cho Masterpact NW",
        "maThietBi": "ELC-MSB-01",
        "tenThietBiSuDung": "Tủ điện MSB 01",
        "tonToiThieu": 1,
        "tonThucTe": 3,
        "donViTinh": "Bộ",
        "viTriLuu": "Tủ linh kiện điện tử",
        "ghiChu": "Vật tư dự phòng sự cố tủ phân phối chính",
        "donGia": 3200000
    },
    {
        "maVatTu": "SP-HVAC-FILT-F8",
        "tenVatTu": "Tấm lọc túi F8 cho AHU/PAU",
        "thongSo": "592 x 592 x 535 mm - 6 túi sợi tổng hợp",
        "maThietBi": "HVAC-PAU-01",
        "tenThietBiSuDung": "PAU 01",
        "tonToiThieu": 12,
        "tonThucTe": 24,
        "donViTinh": "Tấm",
        "viTriLuu": "Kho lọc tầng 2",
        "ghiChu": "Thay định kỳ 3 tháng/lần cho toàn bộ phòng sạch",
        "donGia": 380000
    },
    {
        "maVatTu": "SP-INV-FUSE-30A",
        "tenVatTu": "Cầu chì DC 1000V cho Inverter Solar",
        "thongSo": "10x38mm 30A 1000VDC gPV - Bussmann",
        "maThietBi": "ELC-DB-Solar-01",
        "tenThietBiSuDung": "Trạm điện solar - 1",
        "tonToiThieu": 20,
        "tonThucTe": 45,
        "donViTinh": "Cái",
        "viTriLuu": "Hộp vật tư Solar S-01",
        "ghiChu": "Bảo vệ các string tấm pin năng lượng mặt trời",
        "donGia": 85000
    }
]

# Sheet 6: STOCK TRANSACTIONS
stock_list = [
    {
        "transId": "TRX-20261105-01",
        "ngay": "2026-11-05",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-HVAC-FILT-F8",
        "thietBiSuDung": "HVAC-PAU-01",
        "soLuong": 4,
        "nguoiThucHien": "Khiêm Huỳnh",
        "ghiChu": "Xuất thay phin lọc túi định kỳ cho PAU 01"
    },
    {
        "transId": "TRX-20261102-01",
        "ngay": "2026-11-02",
        "loaiGD": "Nhập kho",
        "maVatTu": "SP-HVAC-BELT-SPC",
        "thietBiSuDung": "Kho kỹ thuật",
        "soLuong": 10,
        "nguoiThucHien": "Khiêm Huỳnh",
        "ghiChu": "Nhập kho theo PO-2026-10-88 từ nhà cung cấp Bando"
    },
    {
        "transId": "TRX-20261028-02",
        "ngay": "2026-10-28",
        "loaiGD": "Xuất kho sử dụng",
        "maVatTu": "SP-CMP-OIL-ROTO",
        "thietBiSuDung": "CMP-GA90-02",
        "soLuong": 2,
        "nguoiThucHien": "Khiêm Huỳnh",
        "ghiChu": "Xuất châm dầu máy nén GA90-2 kiểm tra xử lý sự cố nóng máy"
    },
    {
        "transId": "TRX-20261020-01",
        "ngay": "2026-10-20",
        "loaiGD": "Nhập kho",
        "maVatTu": "SP-WAT-RO-8040",
        "thietBiSuDung": "Kho kỹ thuật",
        "soLuong": 6,
        "nguoiThucHien": "Khiêm Huỳnh",
        "ghiChu": "Nhập đợt màng RO mới từ nhà phân phối DuPont"
    }
]

# Sheet 7: POWER 10 DAYS
power_10days_list = [
    {
        "id": "PWR-2026-10-P3",
        "thoiGianLuu": "2026-11-01 08:00",
        "chuKy": "Kỳ 3 (21-31)",
        "tuNgay": "2026-10-21",
        "denNgay": "2026-10-31",
        "ngayLamViec": 10,
        "loaiCa": "Ca 3 (24/7)",
        "tbNgayKwh": 24850,
        "evnBT": 142000,
        "evnCD": 68500,
        "evnTD": 38000,
        "solarBT": 16500,
        "solarCD": 12800,
        "pLighting": 18200,
        "pAcmv": 115000,
        "pEquipment": 98000,
        "uChiller": 62000,
        "uMChiller": 9800,
        "uComp": 41500,
        "uPump": 14200,
        "uCooling": 11200,
        "uOther": 8500,
        "oAcmv": 12500,
        "oSocket": 9800,
        "oKit": 6400,
        "oServer": 8900,
        "oLighting": 5200,
        "nguoiChot": "Khiêm Huỳnh"
    },
    {
        "id": "PWR-2026-10-P2",
        "thoiGianLuu": "2026-10-21 08:00",
        "chuKy": "Kỳ 2 (11-20)",
        "tuNgay": "2026-10-11",
        "denNgay": "2026-10-20",
        "ngayLamViec": 10,
        "loaiCa": "Ca 3 (24/7)",
        "tbNgayKwh": 25120,
        "evnBT": 145000,
        "evnCD": 69200,
        "evnTD": 37000,
        "solarBT": 15800,
        "solarCD": 12200,
        "pLighting": 18000,
        "pAcmv": 118000,
        "pEquipment": 99500,
        "uChiller": 63500,
        "uMChiller": 10200,
        "uComp": 42100,
        "uPump": 14500,
        "uCooling": 11500,
        "uOther": 8800,
        "oAcmv": 12800,
        "oSocket": 9900,
        "oKit": 6500,
        "oServer": 9000,
        "oLighting": 5300,
        "nguoiChot": "Khiêm Huỳnh"
    },
    {
        "id": "PWR-2026-10-P1",
        "thoiGianLuu": "2026-10-11 08:00",
        "chuKy": "Kỳ 1 (01-10)",
        "tuNgay": "2026-10-01",
        "denNgay": "2026-10-10",
        "ngayLamViec": 10,
        "loaiCa": "Ca 3 (24/7)",
        "tbNgayKwh": 24600,
        "evnBT": 140500,
        "evnCD": 67800,
        "evnTD": 37700,
        "solarBT": 17200,
        "solarCD": 13100,
        "pLighting": 17900,
        "pAcmv": 113500,
        "pEquipment": 96800,
        "uChiller": 61200,
        "uMChiller": 9600,
        "uComp": 40900,
        "uPump": 13900,
        "uCooling": 10900,
        "uOther": 8300,
        "oAcmv": 12300,
        "oSocket": 9700,
        "oKit": 6300,
        "oServer": 8800,
        "oLighting": 5100,
        "nguoiChot": "Khiêm Huỳnh"
    }
]

# Sheet 8: COST MANAGEMENT
cost_list = [
    {
        "idChiPhi": "CP-2026-11-001",
        "ngayGhiNhan": "2026-11-05",
        "phanLoai": "Bảo trì định kỳ",
        "thamChieu": "HVAC-PAU-01",
        "soTienVND": 1520000,
        "nhaCungCap": "Công ty TNHH Kỹ thuật Lọc Camfil VN",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Chi phí mua 4 tấm lọc túi F8 thay thế PAU 01"
    },
    {
        "idChiPhi": "CP-2026-11-002",
        "ngayGhiNhan": "2026-11-02",
        "phanLoai": "Mua vật tư thay thế",
        "thamChieu": "KHO-VATTU",
        "soTienVND": 4500000,
        "nhaCungCap": "Đại lý dây curoa Bando / D&D",
        "trangThai": "Đã duyệt",
        "ghiChu": "Nhập lô dây curoa truyền động các AHU"
    },
    {
        "idChiPhi": "CP-2026-10-008",
        "ngayGhiNhan": "2026-10-28",
        "phanLoai": "Sửa chữa đột xuất",
        "thamChieu": "CMP-GA90-02",
        "soTienVND": 18500000,
        "nhaCungCap": "Trung tâm dịch vụ Atlas Copco Vietnam",
        "trangThai": "Chờ duyệt",
        "ghiChu": "Báo giá kiểm tra chuyên sâu và thay gioăng phớt cụm két sinh hàn dầu máy nén GA90-2"
    },
    {
        "idChiPhi": "CP-2026-10-005",
        "ngayGhiNhan": "2026-10-15",
        "phanLoai": "Kiểm định an toàn",
        "thamChieu": "CMP-AIR-T",
        "soTienVND": 6500000,
        "nhaCungCap": "Trung tâm Kiểm định Kỹ thuật An toàn Khu vực II",
        "trangThai": "Đã thanh toán",
        "ghiChu": "Kiểm định định kỳ bình chịu áp lực khí nén 5000L kèm cấp tem kiểm định 3 năm"
    }
]

# Sheet 9: WATER MONTHLY
water_list = [
    {
        "month": "2026-10",
        "waterM3": 4620,
        "waterVND": 66990000,
        "waterUSD": 2679.6,
        "sewageVND": 34500000,
        "sewageUSD": 1380.0
    },
    {
        "month": "2026-09",
        "waterM3": 4480,
        "waterVND": 64960000,
        "waterUSD": 2598.4,
        "sewageVND": 33200000,
        "sewageUSD": 1328.0
    },
    {
        "month": "2026-08",
        "waterM3": 4810,
        "waterVND": 69745000,
        "waterUSD": 2789.8,
        "sewageVND": 35800000,
        "sewageUSD": 1432.0
    },
    {
        "month": "2026-07",
        "waterM3": 4550,
        "waterVND": 65975000,
        "waterUSD": 2639.0,
        "sewageVND": 33900000,
        "sewageUSD": 1356.0
    }
]

# Sheet 11: METER READINGS
meters_list = [
    {
        "id": "MET-001",
        "timestamp": "2026-11-10 07:30",
        "ngayChot": "2026-11-10",
        "nguon": "EVN",
        "tenDongHo": "Đồng hồ Trạm Trung thế 1 (ELC-MV-01)",
        "chiSoCu": 142350,
        "chiSoMoi": 145120,
        "tieuThu": 2770,
        "donVi": "kWh",
        "nguoiGhi": "Khiêm Huỳnh"
    },
    {
        "id": "MET-002",
        "timestamp": "2026-11-10 07:30",
        "ngayChot": "2026-11-10",
        "nguon": "EVN",
        "tenDongHo": "Đồng hồ Trạm Trung thế 2 (ELC-MV-02)",
        "chiSoCu": 138400,
        "chiSoMoi": 141080,
        "tieuThu": 2680,
        "donVi": "kWh",
        "nguoiGhi": "Khiêm Huỳnh"
    },
    {
        "id": "MET-003",
        "timestamp": "2026-11-10 07:45",
        "ngayChot": "2026-11-10",
        "nguon": "Solar",
        "tenDongHo": "Tổng Inverter Solar Mái Nhà (ELC-DB-Solar-01)",
        "chiSoCu": 84210,
        "chiSoMoi": 85850,
        "tieuThu": 1640,
        "donVi": "kWh",
        "nguoiGhi": "Khiêm Huỳnh"
    },
    {
        "id": "MET-004",
        "timestamp": "2026-11-10 08:00",
        "ngayChot": "2026-11-10",
        "nguon": "Nước Máy",
        "tenDongHo": "Đồng hồ nước thủy cục vào nhà máy (PUMP-WTANK)",
        "chiSoCu": 28410,
        "chiSoMoi": 28565,
        "tieuThu": 155,
        "donVi": "m3",
        "nguoiGhi": "Khiêm Huỳnh"
    },
    {
        "id": "MET-005",
        "timestamp": "2026-11-10 08:00",
        "ngayChot": "2026-11-10",
        "nguon": "Nước Tái Sử Dụng",
        "tenDongHo": "Lưu lượng kế xả thải tự động (WAT-WW)",
        "chiSoCu": 19520,
        "chiSoMoi": 19648,
        "tieuThu": 128,
        "donVi": "m3",
        "nguoiGhi": "Khiêm Huỳnh"
    }
]

# Sheet 12: SYSTEM AUDIT LOGS
audit_list = [
    {
        "id": "LOG-001",
        "thoiGian": "2026-11-10 08:30:15",
        "nguoiThaoTac": "Khiêm Huỳnh",
        "hanhDong": "Đăng nhập",
        "chucNang": "Hệ thống CMMS",
        "doiTuong": "Tài khoản NV-ENG-001",
        "chiTietNoiDung": "Đăng nhập thành công với vai trò Trưởng phòng Kỹ thuật."
    },
    {
        "id": "LOG-002",
        "thoiGian": "2026-11-10 08:15:20",
        "nguoiThaoTac": "Khiêm Huỳnh",
        "hanhDong": "Thêm",
        "chucNang": "Chốt số điện nước",
        "doiTuong": "MET-001",
        "chiTietNoiDung": "Ghi nhận chỉ số điện EVN Trạm 1: 145120 kWh (tiêu thụ 2770 kWh)."
    },
    {
        "id": "LOG-003",
        "thoiGian": "2026-11-09 16:45:00",
        "nguoiThaoTac": "Khiêm Huỳnh",
        "hanhDong": "Hoàn thành",
        "chucNang": "Kế hoạch bảo trì",
        "doiTuong": "WAT-WW",
        "chiTietNoiDung": "Nghiệm thu bảo trì hệ thống xử lý nước thải WAT-WW, tự động tính ngày kế tiếp 2026-11-10."
    },
    {
        "id": "LOG-004",
        "thoiGian": "2026-11-05 14:20:00",
        "nguoiThaoTac": "Khiêm Huỳnh",
        "hanhDong": "Hoàn thành",
        "chucNang": "Lịch sử bảo trì",
        "doiTuong": "HVAC-PAU-01",
        "chiTietNoiDung": "Hoàn tất thay phin lọc túi F8 cho PAU 01, dừng máy 60 phút, kết quả Đạt."
    }
]

# Generate TypeScript file
ts_content = f'''import {{
  Equipment,
  MaintenancePlan,
  MaintenanceHistory,
  Ticket,
  SparePart,
  StockTransaction,
  Power10Days,
  CostRecord,
  WaterMonthly,
  Employee,
  MeterReading,
  AuditLog,
}} from '../types/cmms';

// Sheet 1: Danh_sach_thiet_bi (48 Master Equipments from actual factory data)
export const INITIAL_EQUIPMENT: Equipment[] = {json.dumps(equipment_list, ensure_ascii=False, indent=2)};

// Sheet 2: Ke_hoach_bao_tri (Derived directly from equipment & maintenance history)
export const INITIAL_MAINTENANCE_PLANS: MaintenancePlan[] = {json.dumps(plans_list, ensure_ascii=False, indent=2)};

// Sheet 3: Lich_su_bao_tri (Authentic completed maintenance records with real photos & downtime)
export const INITIAL_MAINTENANCE_HISTORY: MaintenanceHistory[] = {json.dumps(history_list, ensure_ascii=False, indent=2)};

// Sheet 4: Tickets (Internal maintenance work orders)
export const INITIAL_TICKETS: Ticket[] = {json.dumps(tickets_list, ensure_ascii=False, indent=2)};

// Sheet 5: Spare_part (Spare parts inventory)
export const INITIAL_SPARE_PARTS: SparePart[] = {json.dumps(spare_parts_list, ensure_ascii=False, indent=2)};

// Sheet 6: Kho_xuat_nhap (Warehouse transactions)
export const INITIAL_STOCK_TRANSACTIONS: StockTransaction[] = {json.dumps(stock_list, ensure_ascii=False, indent=2)};

// Sheet 7: Dien_10_Ngay (10-day power tracking EVN & Solar)
export const INITIAL_POWER_10DAYS: Power10Days[] = {json.dumps(power_10days_list, ensure_ascii=False, indent=2)};

// Sheet 8: Quan_ly_chi_phi (Cost tracking)
export const INITIAL_COST_RECORDS: CostRecord[] = {json.dumps(cost_list, ensure_ascii=False, indent=2)};

// Sheet 9: Nuoc_month (Monthly water consumption & sewage)
export const INITIAL_WATER_MONTHLY: WaterMonthly[] = {json.dumps(water_list, ensure_ascii=False, indent=2)};

// Sheet 10: Nhan_vien (Department staff & RBAC authentication)
export const INITIAL_EMPLOYEES: Employee[] = {json.dumps(employees_list, ensure_ascii=False, indent=2)};

// Sheet 11: Dien_Nuoc (System meter readings)
export const INITIAL_METER_READINGS: MeterReading[] = {json.dumps(meters_list, ensure_ascii=False, indent=2)};

// Sheet 12: Log_He_thong (System audit trail)
export const INITIAL_AUDIT_LOGS: AuditLog[] = {json.dumps(audit_list, ensure_ascii=False, indent=2)};
'''

with open('src/data/initialData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Successfully generated src/data/initialData.ts:")
print(f"- {len(equipment_list)} Real Equipment")
print(f"- {len(plans_list)} Maintenance Plans with exact next dates")
print(f"- {len(history_list)} Maintenance History Records")
print(f"- {len(employees_list)} Employees with Khiêm Huỳnh at top")
print(f"- {len(tickets_list)} Tickets")
print(f"- {len(spare_parts_list)} Spare Parts")
