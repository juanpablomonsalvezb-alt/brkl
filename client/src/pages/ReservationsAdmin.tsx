import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Download, Search, Calendar, User, Mail, Phone, BookOpen } from "lucide-react";

interface Reservation {
  id: number;
  studentFullName: string;
  studentRut: string;
  dateOfBirth: string;
  age?: string;
  guardianFullName: string;
  guardianRut: string;
  studentEmail: string;
  guardianEmail: string;
  phone: string;
  courseOfInterest: string;
  selectedPlan: string;
  createdAt: string;
}

export default function ReservationsAdmin() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
  });

  const filteredReservations = reservations.filter((reservation) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      reservation.studentFullName.toLowerCase().includes(searchLower) ||
      reservation.studentRut.toLowerCase().includes(searchLower) ||
      reservation.guardianFullName.toLowerCase().includes(searchLower) ||
      reservation.studentEmail.toLowerCase().includes(searchLower) ||
      reservation.phone.includes(searchLower)
    );
  });

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Fecha Registro",
      "Nombre Alumno",
      "RUT Alumno",
      "Fecha Nacimiento",
      "Edad",
      "Email Alumno",
      "Nombre Apoderado",
      "RUT Apoderado",
      "Email Apoderado",
      "Teléfono",
      "Curso de Interés",
      "Plan Seleccionado"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredReservations.map(r => [
        r.id,
        new Date(r.createdAt).toLocaleDateString('es-CL'),
        `"${r.studentFullName}"`,
        r.studentRut,
        r.dateOfBirth,
        r.age || "",
        r.studentEmail,
        `"${r.guardianFullName}"`,
        r.guardianRut,
        r.guardianEmail,
        r.phone,
        `"${r.courseOfInterest}"`,
        `"${r.selectedPlan}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reservas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002147]/5 to-white py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-[#002147] mb-2">
                Gestión de Inscripciones
              </h1>
              <p className="text-[#002147]/70">
                Panel de administración de inscripciones
              </p>
            </div>
            <Badge className="bg-[#A51C30] text-white text-lg px-4 py-2">
              {filteredReservations.length} Inscripciones
            </Badge>
          </div>

          {/* Search and Export */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#002147]/40 w-5 h-5" />
              <Input
                placeholder="Buscar por nombre, RUT, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-[#002147]/20 focus:border-[#A51C30]"
              />
            </div>
            <Button
              onClick={exportToCSV}
              className="bg-[#002147] hover:bg-[#003366] text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border-l-4 border-[#A51C30]">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-[#A51C30]" />
              <div>
                <p className="text-sm text-[#002147]/70">Total Inscripciones</p>
                <p className="text-2xl font-bold text-[#002147]">{reservations.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-[#002147]">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-[#002147]" />
              <div>
                <p className="text-sm text-[#002147]/70">Este Mes</p>
                <p className="text-2xl font-bold text-[#002147]">
                  {reservations.filter(r => {
                    const date = new Date(r.createdAt);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-green-600">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-[#002147]/70">Menores</p>
                <p className="text-2xl font-bold text-[#002147]">
                  {reservations.filter(r => !r.courseOfInterest.includes('adultos')).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-orange-600">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-[#002147]/70">Adultos</p>
                <p className="text-2xl font-bold text-[#002147]">
                  {reservations.filter(r => r.courseOfInterest.includes('adultos')).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-[#002147]/60">Cargando inscripciones...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[#002147]/60">
                {searchTerm ? "No se encontraron inscripciones con ese criterio" : "No hay inscripciones aún"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#002147]">
                    <TableHead className="text-white">Fecha</TableHead>
                    <TableHead className="text-white">Alumno</TableHead>
                    <TableHead className="text-white">RUT Alumno</TableHead>
                    <TableHead className="text-white">Edad</TableHead>
                    <TableHead className="text-white">Apoderado</TableHead>
                    <TableHead className="text-white">Contacto</TableHead>
                    <TableHead className="text-white">Curso</TableHead>
                    <TableHead className="text-white">Plan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id} className="hover:bg-[#002147]/5">
                      <TableCell className="font-medium">
                        {new Date(reservation.createdAt).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-[#002147]">{reservation.studentFullName}</p>
                          <p className="text-xs text-[#002147]/60 flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {reservation.studentEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{reservation.studentRut}</TableCell>
                      <TableCell className="text-sm">
                        {reservation.age || new Date().getFullYear() - new Date(reservation.dateOfBirth).getFullYear() + " años"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-[#002147]">{reservation.guardianFullName}</p>
                          <p className="text-xs text-[#002147]/60">{reservation.guardianRut}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-xs flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#A51C30]" />
                            {reservation.phone}
                          </p>
                          <p className="text-xs flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#A51C30]" />
                            {reservation.guardianEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${
                          reservation.courseOfInterest.includes('adultos')
                            ? 'bg-orange-100 text-orange-700 border-orange-300'
                            : 'bg-green-100 text-green-700 border-green-300'
                        }`}>
                          {reservation.courseOfInterest}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium text-[#A51C30]">
                          {reservation.selectedPlan}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
