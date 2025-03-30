import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from "../config/mysql"

// Definición de los atributos del usuario
interface ProyectoAttributes {
    ID: number;
    Nombre: string;
}

// Atributos opcionales para la creación de un usuario
interface ProyectoCreationAttributes extends Optional<ProyectoAttributes, 'ID'> {}

// Definición de la clase de modelo
class Proyecto extends Model<ProyectoAttributes, ProyectoCreationAttributes> implements ProyectoAttributes {
    public ID!: number;
    public Nombre!:string;
}

// Inicialización del modelo
Proyecto.init({
    ID: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    Nombre: {
        type: DataTypes.STRING,
        allowNull:false
    },
}, {
    sequelize,
    tableName: 'Proyecto',
    timestamps: false, 
});

export { Proyecto, ProyectoAttributes };
