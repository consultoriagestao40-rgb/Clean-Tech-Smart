import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

const rentalItems = [
  ['AMAT4001-2C', 'Lavad Oper a Bordo', 'Brava Alfa Bateria Celular', 145215.59, 101651.00, 3862.73, 3100.35, 2998.70, 2897.05, 2785.23],
  ['AMAT4001-2CP', 'Lavad Oper a Bordo', 'Brava Alfa Bateria Celular + Jogo Extra de Bateria', 168650.03, 118055.00, 4486.09, 3600.68, 3482.62, 3364.57, 3234.71],
  ['AMAT4001-2M1', 'Lavad Oper a Bordo', 'Brava Alfa Bateria Monobloco 305 Ah', 135579.01, 94906.00, 3606.42, 2894.62, 2799.72, 2704.81, 2600.42],
  ['AMAT4001-2M1P', 'Lavad Oper a Bordo', 'Brava Alfa Bateria Monobloco 305 Ah + Jogo Extra de Bateria', 150899.71, 105630.00, 4013.90, 3221.71, 3116.08, 3010.45, 2894.26],
  ['AMAT4001-2S', 'Lavad Oper a Bordo', 'Brava Alfa Bateria Selada', 135579.01, 94906.00, 3606.42, 2894.62, 2799.72, 2704.81, 2600.42],
  ['AMAT4001-2SP', 'Lavad Oper a Bordo', 'Brava Alfa Bateria Selada + Jogo Extra de Bateria', 150899.71, 105630.00, 4013.90, 3221.71, 3116.08, 3010.45, 2894.26],
  ['AMATA135-220', 'Lavad Oper a Pé', 'A135 Alfa 220V', 19562.89, 12325.00, 468.34, 375.90, 363.58, 351.25, 337.89],
  ['AMATA135L', 'Lavad Oper a Pé', 'A135 Alfabat Litio', 28528.14, 17973.00, 682.98, 548.17, 530.20, 512.22, 492.45],
  ['AMATA140AGM', 'Lavad Oper a Pé', 'A140 Alfa AGM', 24914.83, 15696.00, 596.48, 478.74, 463.04, 447.35, 430.08],
  ['AMATA140AGMSP', 'Lavad Oper a Pé', 'A140 Alfa AGM + Jogo Extra de Bateria', 27476.46, 17310.00, 657.79, 527.95, 510.65, 493.34, 474.30],
  ['AMATA16', 'Lavad Oper a Pé', 'A16 Alfa Bateria Litio', 244218.00, 178279.00, 7042.03, 5704.93, 5526.65, 5348.37, 5152.27],
  ['AMATA260-220', 'Lavad Oper a Pé', 'A260 Alfa 220V', 19818.08, 11891.00, 451.85, 362.67, 350.78, 338.89, 325.81],
  ['AMATA260AGM', 'Lavad Oper a Pé', 'A260 Alfa GEL', 30495.08, 17687.00, 672.11, 539.46, 521.77, 504.08, 484.63],
  ['AMATA650', 'Lavad Oper a Bordo', 'A650 Alfa Bateria', 86139.91, 54269.00, 2082.19, 1655.16, 1600.91, 1546.64, 1486.95],
  ['AMATA750', 'Lavad Oper a Bordo', 'A750 Alfa Bateria', 108314.69, 68238.00, 2593.05, 2081.27, 2013.03, 1944.79, 1869.73],
  ['AMATECOVC', 'Lavad Oper a Pé', 'ECO Alfa 220V', 19950.93, 12569.00, 477.62, 383.36, 370.79, 358.22, 344.39],
  ['AMATFOXVC', 'Lavad Oper a Pé', 'Fox Alfa 220V', 17050.93, 10742.00, 408.20, 327.63, 316.89, 306.15, 294.33],
  ['AMATMINII', 'Lavad Oper a Pé', 'MINI Alfa Litio', 12018.08, 7812.00, 295.85, 238.26, 230.45, 222.63, 214.04],
  ['AMATMINILP', 'Lavad Oper a Pé', 'MINI Alfa Litio 2 x 36V', 14004.27, 9103.00, 345.91, 277.63, 268.53, 259.43, 249.42],
  ['AMATB70', 'Lavad Oper a Pé', 'B70 Alfa Bateria 4 x 12V', 42678.97, 26888.00, 1021.69, 820.04, 793.15, 766.26, 736.69],
  ['AMATB70AGM', 'Lavad Oper a Pé', 'B70 Alfa AGM 4 x 12V', 50662.30, 31917.00, 1212.86, 973.48, 941.56, 909.64, 874.53],
  ['AMATB70L', 'Lavad Oper a Pé', 'B70 Alfa Bateria 2 x 12V', 39294.07, 24756.00, 940.72, 755.05, 730.30, 705.54, 678.31],
  ['AMATB70LAGM', 'Lavad Oper a Pé', 'B70 Alfa AGM 2 x 12V 90Ah', 41351.67, 26052.00, 989.96, 794.57, 768.52, 742.47, 713.81],
  ['APRE400', 'Lav Alta Pressão', 'ALFAPRESSURE 400 Alfa 220V', 12823.65, 8335.00, 316.74, 254.23, 245.89, 237.56, 228.39],
  ['APRE500-220', 'Lav Alta Pressão', 'ALFAPRESSURE 500 Alfa 220V', 18351.38, 11928.00, 453.28, 363.82, 351.89, 339.96, 326.84],
  ['APRE500-380', 'Lav Alta Pressão', 'ALFAPRESSURE 500 Alfa 380V', 18351.38, 11928.00, 453.28, 363.82, 351.89, 339.96, 326.84],
  ['APRE900-220', 'Lav Alta Pressão', 'ALFAPRESSURE H900 Alfa 220V/Diesel', 48809.15, 27333.00, 1038.88, 833.88, 806.33, 778.90, 748.93],
  ['APRE900-380', 'Lav Alta Pressão', 'ALFAPRESSURE H900 Alfa 220V/Diesel', 48809.15, 27333.00, 1038.88, 833.88, 806.33, 778.90, 748.93],
  ['APTA40026C10', 'Agua Pura', 'Agua Pura + KIT 10m Alfa 220V', 76490.52, 42835.00, 1627.72, 1306.46, 1263.62, 1220.79, 1173.67],
  ['APTA40026C16', 'Agua Pura', 'Agua Pura + KIT 16m Alfa 220V', 89471.46, 50104.00, 1903.95, 1528.17, 1478.07, 1427.98, 1372.85],
  ['I-MOP', 'iMop Lite', 'iMop Lite', 29505.16, 22129.00, 840.90, 674.93, 652.80, 630.67, 606.33],
  ['I-MOPP', 'iMop Lite', 'iMop Lite COM PROPULSÃO', 35015.99, 26262.00, 997.94, 800.98, 774.72, 748.46, 719.57],
  ['I-MOPXL', 'iMop XL', 'iMop XL', 38388.72, 24953.00, 948.20, 761.06, 736.10, 711.15, 683.70],
  ['I-MOPXLP', 'iMop XL', 'iMop XL COM PROPULSÃO', 45891.96, 29830.00, 1133.53, 909.81, 879.98, 850.15, 817.34],
  ['S960', 'Varr Oper a Bordo', 'S960 Tennant Bateria C/ Capota', 111950.50, 70529.00, 2680.09, 2151.13, 2080.60, 2010.07, 1932.49],
  ['S960S', 'Varr Oper a Bordo', 'S960 Tennant Bateria S/ Capota', 107577.30, 67963.00, 2582.58, 2072.86, 2004.90, 1936.94, 1862.18],
  ['S1200S', 'Varr Oper a Pé', 'S1200 Alfa Bateria', 98028.59, 61758.00, 2346.80, 1883.62, 1821.86, 1760.10, 1692.17],
  ['S4000S', 'Varr Oper a Bordo', 'S4000 Alfa Bateria', 225956.33, 142352.00, 5409.39, 4341.75, 4199.40, 4057.05, 3900.46],
  ['TNA800', 'Varr Oper a Bordo', '800 Tennant Diesel 1 Esc Lat Varr cabine COM ar condicionado', 1055031.99, 836777.00, 34077.53, 27351.70, 26454.93, 25558.15, 24571.70],
  ['TNA800P', 'Varr Oper a Bordo', '800 Tennant Diesel 1 Esc Lat Varr SEM cabine para Operador SOB ENCOMENDA', 896700.57, 762195.00, 28963.43, 23246.95, 22484.77, 21722.57, 20884.16],
  ['TNAA300AGML', 'Lavad Oper a Pé', 'A300 Alfa Bateria 150Ah Sob encomenda', 45613.44, 29649.00, 1126.65, 904.29, 874.64, 844.99, 812.38],
  ['TNAA300L', 'Lavad Oper a Pé', 'A300 Alfa Bateria 150Ah Sob encomenda', 40821.60, 26534.00, 1008.29, 809.29, 782.73, 756.22, 727.03],
  ['TNAA300NANOL', 'Lavad Oper a Pé', 'A300 NANO Alfa Bateria', 56173.68, 36513.00, 1387.49, 1113.64, 1077.13, 1040.62, 1000.45],
  ['TNAA500AGML', 'Lavad Oper a Pé', 'A500 Alfa Bateria AGM', 75678.29, 47677.00, 1811.74, 1454.16, 1406.48, 1358.80, 1306.36],
  ['TNAA500L', 'Lavad Oper a Pé', 'A500 Alfa Bateria', 71705.03, 45174.00, 1716.62, 1377.81, 1332.64, 1287.46, 1237.77],
  ['TNAB10', 'Lavad Oper a Bordo', 'Tennant Bateria', 188272.05, 141204.00, 5365.75, 4306.72, 4165.52, 4024.32, 3868.99],
  ['TNAB7', 'Polidora', 'B7 Tennant Bateria', 105717.75, 79288.00, 3012.96, 2418.29, 2339.01, 2259.72, 2172.50],
  ['TNABR2000-110', 'Polidora', 'BR-2000 Tennant 110V', 31449.41, 23587.00, 896.31, 719.41, 695.82, 672.23, 646.29],
  ['TNABR2000-220', 'Polidora', 'BR-2000 Tennant 220V', 31449.41, 23587.00, 896.31, 719.41, 695.82, 672.23, 646.29],
  ['TNAM20', 'Lav Varr', 'M20 Tennant GLP 1 Esc Lat Varr COM protetor do operador', 720412.42, 561922.00, 21353.02, 17138.61, 16576.69, 16014.77, 15396.65],
  ['TNAM20ECHO', 'Lav Varr', 'M20 ec-H2O Tennant GLP 1 Esc Lat Varr COM protetor do operador', 749488.57, 584601.00, 22214.94, 17830.33, 17245.73, 16661.13, 16018.07],
  ['TNAS10', 'Varr Oper a Pé', 'S10 Tennant Bateria 1 Esc Lat Varr', 105586.11, 66771.00, 2537.31, 2036.52, 1969.75, 1902.98, 1829.53],
  ['TNAS20', 'Varr Oper a Bordo', 'S20 Tennant GLP 1 Esc Lat Varr COM protetor do operador', 456976.02, 333592.00, 12676.51, 10174.57, 9840.98, 9507.38, 9140.43],
  ['TNAS20B', 'Varr Oper a Bordo', 'S20 Tennant BATERIA 1 Esc Lat Varr COM protetor do operador SOB ENCOMENDA', 524078.59, 382577.00, 14537.94, 11668.61, 11286.03, 10903.45, 10482.62],
  ['TNAS20D', 'Varr Oper a Bordo', 'S20 Tennant DIESEL 1 Esc Lat Varr COM protetor do operador SOB ENCOMENDA', 557246.00, 406790.00, 15458.00, 12407.06, 12000.29, 11593.50, 11146.03],
  ['TNAS20S', 'Varr Oper a Bordo', 'S20 Tennant GLP 1 Esc Lat Varr SEM protetor do operador', 440574.52, 321911.00, 12232.83, 9818.30, 9496.39, 9174.47, 8820.37],
  ['TNAS30', 'Varr Oper a Bordo', 'S30 Tennant GLP 1 Esc Lat Varr 3 rodas com cabine COM protetor do operador', 629321.44, 459405.00, 17457.38, 14011.84, 13552.44, 13093.03, 12587.69],
  ['TNAS30ZL', 'Varr Oper a Bordo', 'S30 Tennant GLP 2 Esc Lat Varr 3 rodas COM protetor do operador SOB ENCOMENDA', 648317.99, 473272.00, 17984.34, 14434.80, 13961.53, 13488.26, 12967.66],
  ['TNAS30ZLS', 'Varr Oper a Bordo', 'S30 Tennant GLP 2 Esc Lat Varr 3 rodas SEM protetor do operador SOB ENCOMENDA', 626867.18, 457610.00, 17389.30, 13957.13, 13499.58, 13041.97, 12538.60],
  ['TNAS30CAB', 'Varr Oper a Bordo', 'S30 Tennant Diesel 1 Esc Lat Varr 4 rodas com cabine - com ar condicionado SOB ENCOMENDA', 839089.81, 612536.00, 23276.35, 18682.33, 18069.80, 17457.26, 16783.47],
  ['TNAS30CAB-3', 'Varr Oper a Bordo', 'S30 Tennant Diesel 1 Esc Lat Varr 3 rodas com cabine - com ar condicionado SOB ENCOMENDA', 779209.05, 568823.00, 21615.26, 17349.09, 16780.27, 16211.44, 15585.74],
  ['TNAS30S', 'Varr Oper a Bordo', 'S30 Tennant GLP 1 Esc Lat Varr 3 rodas SEM protetor do operador', 607870.83, 443746.00, 16862.33, 13534.24, 13090.49, 12646.75, 12158.63],
  ['TNAS7', 'Varr Oper a Pé', 'S7 Tennant Bateria 1 Esc Lat Varr', 49777.00, 36337.00, 1380.81, 1108.29, 1071.95, 1035.61, 995.64],
  ['TNAT16', 'Lavad Oper a Bordo', 'T16 D Tennant Bateria', 315536.13, 230343.00, 8753.03, 7025.46, 6795.11, 6564.77, 6311.36],
  ['TNAT16C', 'Lavad Oper a Bordo', 'T16 C Tennant Bateria', 315536.13, 230343.00, 8753.03, 7025.46, 6795.11, 6564.77, 6311.36],
  ['TNAT16CECHO', 'Lavad Oper a Bordo', 'T16 C ec-H2O Tennant Bateria', 335966.12, 245255.00, 9319.70, 7480.29, 7235.03, 6989.78, 6719.99],
  ['TNAT16CECHOP', 'Lavad Oper a Bordo', 'T16 C ec-H2O Tennant Bateria + Jogo Extra de Bateria', 375430.44, 274084.00, 10414.44, 8358.96, 8084.89, 7810.83, 7509.36],
  ['TNAT16CP', 'Lavad Oper a Bordo', 'T16 C Tennant Bateria + Jogo Extra de Bateria', 354658.21, 258900.00, 9838.22, 7896.47, 7637.56, 7378.66, 7093.87],
  ['TNAT16ECHO', 'Lavad Oper a Bordo', 'T16 D ec-H2O Tennant Bateria', 335966.12, 245255.00, 9319.70, 7480.29, 7235.03, 6989.78, 6719.99],
  ['TNAT16ECHOP', 'Lavad Oper a Bordo', 'T16 D ec-H2O Tennant Bateria + Jogo Extra de Bateria', 375429.89, 274084.00, 10414.42, 8358.95, 8084.88, 7810.82, 7509.35],
  ['TNAT16P', 'Lavad Oper a Bordo', 'T16 D Tennant Bateria + Jogo Extra de Bateria', 354658.21, 258900.00, 9838.22, 7896.47, 7637.56, 7378.66, 7093.87],
  ['TNAT17', 'Lavad Oper a Bordo', 'T17 D Tennant Bateria COM protetor Disco', 566298.20, 413398.00, 15709.11, 12608.63, 12195.23, 11781.83, 11327.10],
  ['TNAT17C', 'Lavad Oper a Bordo', 'T17 D Tennant Bateria COM protetor Cilindrica', 566298.20, 413398.00, 15709.11, 12608.63, 12195.23, 11781.83, 11327.10],
  ['TNAT17CECHO', 'Lavad Oper a Bordo', 'T17 C ec-H2O Tennant Bateria COM protetor Disco', 599655.85, 437749.00, 16634.45, 13351.34, 12913.59, 12475.94, 11994.32],
  ['TNAT17ECHO', 'Lavad Oper a Bordo', 'T17 D ec-H2O Tennant Bateria COM protetor Disco', 599655.85, 437749.00, 16634.45, 13351.34, 12913.59, 12475.94, 11994.32],
  ['TNAT20', 'Lavad Oper a Bordo', 'T20 Tennant GLP Cilindrica 1 Esc Lat Varr COM protetor do operador', 755566.86, 550671.00, 20925.51, 16795.46, 16244.80, 15694.13, 15088.99],
  ['TNAT20D', 'Lavad Oper a Bordo', 'T20 Tennant Diesel 1 Esc Lat COM protetor do operador', 755566.86, 550671.00, 20925.51, 16795.46, 16244.80, 15694.13, 15088.99],
  ['TNAT20ECHO', 'Lavad Oper a Bordo', 'T20 ec-H2O Tennant GLP Cilindrica 1 Esc Lat Varr COM protetor do operador', 781100.57, 578058.00, 21966.21, 17630.76, 17052.72, 16474.68, 15838.90],
  ['TNAT20ECHOD', 'Lavad Oper a Bordo', 'T20 ec-H2O Tennant Diesel 1 Esc Lat Varr SEM protetor do operador', 726499.57, 568670.00, 21533.45, 17283.42, 16718.76, 16150.09, 15526.75],
  ['TNAT20ECHOS', 'Lavad Oper a Bordo', 'T20 ec-H2O Tennant GLP Cilindrica 1 Esc Lat Varr SEM protetor do operador', 726499.57, 568670.00, 21533.45, 17283.42, 16718.76, 16150.09, 15526.75],
  ['TNAT20S', 'Lavad Oper a Bordo', 'T20 Tennant GLP Cilindrica 1 Esc Lat Varr SEM protetor do operador', 697717.81, 535620.00, 20353.96, 16360.81, 15824.39, 15287.97, 14697.90],
  ['TNAT300E-NANOO', 'Lavad Oper a Pé', 'T300e Orbital NANO Tennant Bateria Com Tração', 90003.79, 58502.00, 2223.09, 1784.33, 1725.82, 1667.32, 1602.50],
  ['TNAT300EORB', 'Lavad Oper a Pé', 'T300e Orbital Tennant Bateria Com Tração', 72713.77, 47264.00, 1796.03, 1441.55, 1394.29, 1347.02, 1295.03],
  ['TNAT360', 'Lavad Oper a Pé', 'T360 Tennant Bateria Com Tração', 49985.00, 32491.00, 1281.19, 1037.93, 1005.49, 973.06, 937.38],
  ['TNAT600E', 'Lavad Oper a Bordo', 'T600E Tennant Bateria', 148813.07, 101193.00, 3845.33, 3086.36, 2985.19, 2884.00, 2772.66],
  ['TNAT600ENANO', 'Lavad Oper a Bordo', 'T600E NANO Tennant Bateria', 163764.23, 111360.00, 4231.67, 3396.47, 3285.11, 3173.75, 3051.26],
  ['TNAT7', 'Lavad Oper a Bordo', 'T7 Tennant Bateria', 164396.57, 120009.00, 4560.36, 3690.29, 3540.28, 3420.27, 3289.86],
  ['TNAT760', 'Lavad Oper a Bordo', 'T760 Tennant Bateria', 93683.52, 68389.00, 2721.06, 2189.45, 2120.06, 2051.97, 1974.66],
  ['TNAT760LI', 'Lavad Oper a Bordo', 'T760 Tennant Bateria Litio', 97587.00, 71239.00, 2898.34, 2348.02, 2274.65, 2201.27, 2120.10],
  ['TNAT7ECHO', 'Lavad Oper a Bordo', 'T7 ec-H2O Tennant Bateria', 180933.95, 132082.00, 5019.11, 4028.49, 3898.41, 3764.33, 3619.11]
];

async function initRentalDB() {
  const client = await pool.connect();
  try {
    console.log('Criando tabela rental_prices...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS rental_prices (
        id SERIAL PRIMARY KEY,
        code VARCHAR(100) UNIQUE,
        type VARCHAR(100),
        description TEXT,
        list_price DECIMAL(12,2),
        distributor_price DECIMAL(12,2),
        price_12 DECIMAL(12,2),
        price_24 DECIMAL(12,2),
        price_36 DECIMAL(12,2),
        price_48 DECIMAL(12,2),
        price_60 DECIMAL(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Limpando registros antigos...');
    await client.query('DELETE FROM rental_prices');

    console.log('Inserindo registros da Tabela de Locação...');
    for (const item of rentalItems) {
      await client.query(`
        INSERT INTO rental_prices (
          code, type, description, list_price, distributor_price,
          price_12, price_24, price_36, price_48, price_60
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (code) DO UPDATE SET
          type = EXCLUDED.type,
          description = EXCLUDED.description,
          list_price = EXCLUDED.list_price,
          distributor_price = EXCLUDED.distributor_price,
          price_12 = EXCLUDED.price_12,
          price_24 = EXCLUDED.price_24,
          price_36 = EXCLUDED.price_36,
          price_48 = EXCLUDED.price_48,
          price_60 = EXCLUDED.price_60;
      `, item);
    }

    console.log('Tabela rental_prices populada com sucesso!');
  } catch (error) {
    console.error('Erro ao popular tabela rental_prices:', error);
  } finally {
    client.release();
    pool.end();
  }
}

initRentalDB();
