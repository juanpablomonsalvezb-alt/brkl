// Vórtice: rutas HTTP de la evaluación de cierre (E2, P21 v2).
// Capa fina sobre server/evaluacion.ts. Toda identidad sale de la sesión, nunca del cuerpo.
// Apagadas por defecto: solo se registran con VORTICE_EVALUACION_RUTAS=1, porque dependen de la
// migración 0005, que aún no se aplica a una base real.
import type { Express, Request, Response } from "express";
import type { Client } from "@libsql/client";
import {
  abrirProceso, iniciarIntento, responder, enviarIntento, cerrarProceso,
  reabrirPorAdministrador, verificarEntregaAutomatica, preguntasDelIntento, ErrorEvaluacion, type CodigoEvaluacion,
} from "./evaluacion";

export interface DepsRutasEvaluacion {
  client: Client;
  userId: (req: Request) => string | undefined;
  esAdmin: (userId: string) => Promise<boolean>;
}

const ESTADO: Record<CodigoEvaluacion, number> = {
  perfil_invalido: 400,
  pregunta_no_pertenece_version: 400,
  proceso_no_encontrado: 404,
  instancia_no_encontrada: 404,
  intento_no_encontrado: 404,
  version_no_encontrada: 404,
  intento_no_activo: 409,
  intento_enviado: 409,
  proceso_cerrado: 409,
  extra_no_disponible: 409,
  extra_ya_existe: 409,
  normal_no_enviado: 409,
  capacidad_insuficiente: 409,
  entrega_automatica: 409,
  extra_plazo_vencido: 410,
};

class ErrorHttp extends Error {
  constructor(readonly status: number, mensaje: string) { super(mensaje); }
}

const texto = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export function rutasEvaluacionHabilitadas(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VORTICE_EVALUACION_RUTAS === "1";
}

export function registrarRutasEvaluacion(app: Express, deps: DepsRutasEvaluacion): void {
  const { client: c } = deps;

  // Envuelve cada ruta: exige sesión, traduce ErrorEvaluacion a HTTP y no filtra detalles internos.
  const ruta = (f: (uid: string, req: Request) => Promise<unknown>) =>
    async (req: Request, res: Response) => {
      try {
        const uid = deps.userId(req);
        if (!uid) return res.status(401).json({ message: "Unauthorized" });
        res.json(await f(uid, req));
      } catch (e) {
        if (e instanceof ErrorHttp) return res.status(e.status).json({ message: e.message });
        if (e instanceof ErrorEvaluacion) {
          return res.status(ESTADO[e.codigo] ?? 400).json({ codigo: e.codigo, message: e.message.replace(/^[a-z_]+: /, "") });
        }
        console.error("Error en ruta de evaluación:", e);
        res.status(500).json({ message: "Failed to process evaluation request" });
      }
    };

  // Propiedad: la fila pedida debe ser del estudiante en sesión (404 si no, sin revelar si existe).
  const esDelEstudiante = async (tabla: "evaluation_attempts" | "evaluation_instances" | "evaluation_processes", id: string, uid: string) => {
    const r = await c.execute({ sql: `SELECT 1 FROM ${tabla} WHERE id = ? AND student_id = ?`, args: [id, uid] });
    return r.rows.length > 0;
  };

  // Abre (o devuelve) el proceso del estudiante. El perfil lo declara el administrador; sin
  // declaración, regular. La versión sale del servidor: la última validada o asignada.
  app.post("/api/vortice/evaluaciones/:evaluacionId/proceso", ruta(async (uid, req) => {
    const evaluacionId = texto(req.params.evaluacionId);
    if (!evaluacionId) throw new ErrorEvaluacion("proceso_no_encontrado", "evaluación requerida");
    const existente = await c.execute({
      sql: "SELECT p.id AS proceso_id, i.id AS instancia_id, i.student_profile AS perfil, i.duration_minutes AS duracion, i.passing_score AS umbral, p.status AS estado FROM evaluation_processes p JOIN evaluation_instances i ON i.process_id = p.id WHERE p.student_id = ? AND p.evaluation_id = ? ORDER BY i.id DESC LIMIT 1",
      args: [uid, evaluacionId],
    });
    if (existente.rows.length) {
      const r = existente.rows[0] as any;
      return { procesoId: r.proceso_id, instanciaId: r.instancia_id, perfil: r.perfil, duracionMin: r.duracion, umbral: r.umbral, estado: r.estado, existente: true };
    }
    const v = await c.execute({
      sql: "SELECT id FROM evaluation_versions WHERE evaluation_id = ? AND status IN ('validada','asignada') ORDER BY version DESC LIMIT 1",
      args: [evaluacionId],
    });
    if (!v.rows.length) throw new ErrorEvaluacion("version_no_encontrada", "no hay versión publicada de esta evaluación");
    return abrirProceso(c, { estudianteId: uid, evaluacionId, versionId: String((v.rows[0] as any).id), perfil: "regular" });
  }));

  // Inicia un intento. El extra arma sus preguntas con el banco de la base (ver cargarBancoExtra).
  app.post("/api/vortice/evaluaciones/instancias/:instanciaId/intentos", ruta(async (uid, req) => {
    const tipo = req.body?.tipo;
    if (tipo !== "normal" && tipo !== "extra") throw new ErrorHttp(400, "tipo debe ser normal o extra");
    return iniciarIntento(c, { instanciaId: String(req.params.instanciaId), estudianteId: uid, tipo });
  }));

  // Preguntas del intento, sin la clave correcta ni la explicación.
  app.get("/api/vortice/evaluaciones/intentos/:intentoId/preguntas", ruta(async (uid, req) => {
    const id = String(req.params.intentoId);
    if (!(await esDelEstudiante("evaluation_attempts", id, uid))) throw new ErrorEvaluacion("intento_no_encontrado", "intento no encontrado");
    const ids = await preguntasDelIntento(c, id);
    if (!ids.length) return [];
    const r = await c.execute({ sql: `SELECT id, stem, options_json FROM question_versions WHERE id IN (${ids.map(() => "?").join(",")})`, args: ids.map((q) => q.id) });
    const por = new Map((r.rows as any[]).map((x) => [String(x.id), x]));
    return ids.map((q, i) => ({ preguntaVersionId: q.id, enunciado: por.get(q.id)?.stem, posicion: i, opciones: JSON.parse(String(por.get(q.id)?.options_json ?? "[]")) }));
  }));

  app.post("/api/vortice/evaluaciones/intentos/:intentoId/responder", ruta(async (uid, req) => {
    const preguntaVersionId = texto(req.body?.preguntaVersionId), opcionId = texto(req.body?.opcionId);
    if (!preguntaVersionId || !opcionId) throw new ErrorEvaluacion("pregunta_no_pertenece_version", "preguntaVersionId y opcionId son obligatorios");
    const r = await responder(c, { intentoId: String(req.params.intentoId), estudianteId: uid, preguntaVersionId, opcionId });
    return { respuestaId: r.respuestaId, secuencia: r.secuencia }; // no se revela si fue correcta antes de enviar
  }));

  app.post("/api/vortice/evaluaciones/intentos/:intentoId/enviar", ruta(async (uid, req) =>
    enviarIntento(c, { intentoId: String(req.params.intentoId), estudianteId: uid, envioId: texto(req.body?.envioId) })));

  // Cierra la entrega si venció el tiempo (la llama el cliente al llegar a cero o al reconectar).
  app.post("/api/vortice/evaluaciones/intentos/:intentoId/verificar-tiempo", ruta(async (uid, req) => {
    const r = await verificarEntregaAutomatica(c, { intentoId: String(req.params.intentoId), estudianteId: uid });
    return r ?? { vencido: false };
  }));

  app.post("/api/vortice/evaluaciones/procesos/:procesoId/cerrar", ruta(async (uid, req) =>
    cerrarProceso(c, { procesoId: String(req.params.procesoId), estudianteId: uid })));

  // Administración: declarar perfil al abrir el proceso y reabrir una sola vez con motivo.
  app.post("/api/admin/vortice/evaluaciones/:evaluacionId/proceso", ruta(async (uid, req) => {
    if (!(await deps.esAdmin(uid))) throw new ErrorHttp(403, "Forbidden: Admin access required");
    const estudianteId = texto(req.body?.estudianteId), perfil = req.body?.perfil;
    const evaluacionId = String(req.params.evaluacionId);
    if (!estudianteId) throw new ErrorEvaluacion("proceso_no_encontrado", "estudianteId requerido");
    const v = await c.execute({ sql: "SELECT id FROM evaluation_versions WHERE evaluation_id = ? AND status IN ('validada','asignada') ORDER BY version DESC LIMIT 1", args: [evaluacionId] });
    if (!v.rows.length) throw new ErrorEvaluacion("version_no_encontrada", "no hay versión publicada de esta evaluación");
    return abrirProceso(c, { estudianteId, evaluacionId, versionId: String((v.rows[0] as any).id), perfil });
  }));

  app.post("/api/admin/vortice/evaluaciones/procesos/:procesoId/reabrir", ruta(async (uid, req) => {
    if (!(await deps.esAdmin(uid))) throw new ErrorHttp(403, "Forbidden: Admin access required");
    const estudianteId = texto(req.body?.estudianteId), motivo = texto(req.body?.motivo);
    if (!estudianteId || !motivo) throw new ErrorEvaluacion("proceso_no_encontrado", "estudianteId y motivo son obligatorios");
    return reabrirPorAdministrador(c, { procesoId: String(req.params.procesoId), estudianteId, administradorId: uid, motivo });
  }));
}
