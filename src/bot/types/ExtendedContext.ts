import { Context, SessionFlavor} from "grammy";
import { SessionData } from "./index"

type ExtendedContext = Context & SessionFlavor<SessionData>;

export default ExtendedContext;
