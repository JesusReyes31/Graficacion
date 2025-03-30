import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from "../config/mysql"

// Definición de los atributos del usuario
interface VersionesAttributes {
    ID_V: number;
    ID_Proyecto: number;
    ID_Tipo: number;
    json: string;
}

// Atributos opcionales para la creación de un usuario
interface VersionesCreationAttributes extends Optional<VersionesAttributes, 'ID_V'> {}

// Definición de la clase de modelo
class Versiones extends Model<VersionesAttributes, VersionesCreationAttributes> implements VersionesAttributes {
    public ID_V!: number;
    public ID_Proyecto!: number;
    public ID_Tipo!: number;
    public json!:string;
}

// Inicialización del modelo
Versiones.init({
    ID_V: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    ID_Proyecto: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull:false
    },
    ID_Tipo: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull:false
    },
    json: {
        type: DataTypes.STRING(10000),
        allowNull:false
    },
}, {
    sequelize,
    tableName: 'Versiones',
    timestamps: false, 
});

export { Versiones, VersionesAttributes };
