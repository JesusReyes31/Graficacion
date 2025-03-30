import { sequelize } from "../config/mysql";
import { Diagrama } from "./diagrama.model";
import { Proyecto } from "./proyectos.model";
import { Usuarios } from "./usuarios.model";
import { Versiones } from "./versiones.model";


// Un proyecto puede tener muchas versiones
Proyecto.hasMany(Versiones, { foreignKey: "ID_Proyecto" });
Versiones.belongsTo(Proyecto, { foreignKey: "ID_Proyecto" });

// Un tipo de diagrama puede tener muchas versiones
Diagrama.hasMany(Versiones, { foreignKey: "ID_Tipo" });
Versiones.belongsTo(Diagrama, { foreignKey: "ID_Tipo" });

// Un tipo de diagrama puede tener muchas versiones
// Usuarios.hasMany(Versiones, { foreignKey: "ID_Usuario" });
// Versiones.belongsTo(Usuarios, { foreignKey: "ID_Usuario" });


const initializeDb = async () => {
    await sequelize.sync({ force: false })
    .then(() => {
        console.log('Modelos sincronizados correctamente');
    })
    .catch((error) => {
        console.error('Error al sincronizar los modelos:', error);
    });
    const Diagramas = await Diagrama.findAll();
    if (Diagramas.length > 0) return;
    await Diagrama.bulkCreate([
        { Tipo: 'CU' },
        { Tipo: 'Secuencias' },
        { Tipo: 'Paquetes' },
        { Tipo: 'Componentes' },
        { Tipo: 'Clases' },
    ])
    await Usuarios.bulkCreate([
        { Nombre: 'Usuario 1' },
    ])
}

initializeDb();