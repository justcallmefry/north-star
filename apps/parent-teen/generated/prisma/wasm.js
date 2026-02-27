
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  emailVerified: 'emailVerified',
  name: 'name',
  image: 'image',
  password: 'password',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.RelationshipScalarFieldEnum = {
  id: 'id',
  name: 'name',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RelationshipMemberScalarFieldEnum = {
  id: 'id',
  relationshipId: 'relationshipId',
  userId: 'userId',
  role: 'role',
  leftAt: 'leftAt',
  joinedAt: 'joinedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InviteScalarFieldEnum = {
  id: 'id',
  code: 'code',
  relationshipId: 'relationshipId',
  invitedBy: 'invitedBy',
  email: 'email',
  status: 'status',
  expiresAt: 'expiresAt',
  claimedBy: 'claimedBy',
  claimedAt: 'claimedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PromptScalarFieldEnum = {
  id: 'id',
  text: 'text',
  momentText: 'momentText',
  type: 'type',
  category: 'category',
  tone: 'tone',
  isPremium: 'isPremium',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DailySessionScalarFieldEnum = {
  id: 'id',
  relationshipId: 'relationshipId',
  sessionDate: 'sessionDate',
  promptId: 'promptId',
  state: 'state',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResponseScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  userId: 'userId',
  content: 'content',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResponseValidationScalarFieldEnum = {
  id: 'id',
  responseId: 'responseId',
  userId: 'userId',
  reactions: 'reactions',
  acknowledgment: 'acknowledgment'
};

exports.Prisma.ReflectionScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  userId: 'userId',
  content: 'content',
  reaction: 'reaction',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MeetingScalarFieldEnum = {
  id: 'id',
  relationshipId: 'relationshipId',
  weekKey: 'weekKey',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MeetingEntryScalarFieldEnum = {
  id: 'id',
  meetingId: 'meetingId',
  userId: 'userId',
  wins: 'wins',
  stressors: 'stressors',
  request: 'request',
  plan: 'plan',
  appreciation: 'appreciation',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StreakScalarFieldEnum = {
  relationshipId: 'relationshipId',
  currentCount: 'currentCount',
  longestCount: 'longestCount',
  lastCompletedDate: 'lastCompletedDate'
};

exports.Prisma.SubscriptionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  relationshipId: 'relationshipId',
  stripeSubscriptionId: 'stripeSubscriptionId',
  stripeCustomerId: 'stripeCustomerId',
  status: 'status',
  currentPeriodEnd: 'currentPeriodEnd',
  cancelAtPeriodEnd: 'cancelAtPeriodEnd',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BetaSignupScalarFieldEnum = {
  id: 'id',
  email: 'email',
  createdAt: 'createdAt'
};

exports.Prisma.QuizSessionScalarFieldEnum = {
  id: 'id',
  relationshipId: 'relationshipId',
  sessionDate: 'sessionDate',
  state: 'state',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuizParticipationScalarFieldEnum = {
  id: 'id',
  quizSessionId: 'quizSessionId',
  userId: 'userId',
  answerIndices: 'answerIndices',
  guessIndices: 'guessIndices',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AgreementSessionScalarFieldEnum = {
  id: 'id',
  relationshipId: 'relationshipId',
  sessionDate: 'sessionDate',
  state: 'state',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AgreementParticipationScalarFieldEnum = {
  id: 'id',
  agreementSessionId: 'agreementSessionId',
  userId: 'userId',
  answerIndices: 'answerIndices',
  guessIndices: 'guessIndices',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.RelationshipStatus = exports.$Enums.RelationshipStatus = {
  active: 'active',
  archived: 'archived'
};

exports.InviteStatus = exports.$Enums.InviteStatus = {
  pending: 'pending',
  accepted: 'accepted',
  expired: 'expired'
};

exports.PromptType = exports.$Enums.PromptType = {
  daily: 'daily',
  daily_meeting: 'daily_meeting'
};

exports.PromptCategory = exports.$Enums.PromptCategory = {
  gratitude: 'gratitude',
  communication: 'communication',
  reflection: 'reflection',
  fun: 'fun',
  growth: 'growth',
  other: 'other'
};

exports.PromptTone = exports.$Enums.PromptTone = {
  light: 'light',
  deep: 'deep',
  playful: 'playful',
  serious: 'serious'
};

exports.SessionState = exports.$Enums.SessionState = {
  open: 'open',
  revealed: 'revealed',
  expired: 'expired'
};

exports.SubscriptionStatus = exports.$Enums.SubscriptionStatus = {
  active: 'active',
  canceled: 'canceled',
  past_due: 'past_due',
  trialing: 'trialing'
};

exports.QuizState = exports.$Enums.QuizState = {
  open: 'open',
  revealed: 'revealed'
};

exports.AgreementState = exports.$Enums.AgreementState = {
  open: 'open',
  revealed: 'revealed'
};

exports.Prisma.ModelName = {
  User: 'User',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  Relationship: 'Relationship',
  RelationshipMember: 'RelationshipMember',
  Invite: 'Invite',
  Prompt: 'Prompt',
  DailySession: 'DailySession',
  Response: 'Response',
  ResponseValidation: 'ResponseValidation',
  Reflection: 'Reflection',
  Meeting: 'Meeting',
  MeetingEntry: 'MeetingEntry',
  Streak: 'Streak',
  Subscription: 'Subscription',
  BetaSignup: 'BetaSignup',
  QuizSession: 'QuizSession',
  QuizParticipation: 'QuizParticipation',
  AgreementSession: 'AgreementSession',
  AgreementParticipation: 'AgreementParticipation'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
