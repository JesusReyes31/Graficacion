import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: Number(process.env.DB_PORT),
    timezone: "-07:00", // Ajusta la zona horaria según necesites
    dialectOptions: {
      connectTimeout: 10000,
    },
    logging: false, // Opcional: para deshabilitar logs de SQL
  }
);

export async function checkSequelizeConnection() {
  try {
    await sequelize.authenticate();
    console.log("Conexión a MySQL (Sequelize) exitosa");
  } catch (error) {
    console.error("Error en la conexión a MySQL (Sequelize):", error);
    throw error;
  }
}

export { sequelize };