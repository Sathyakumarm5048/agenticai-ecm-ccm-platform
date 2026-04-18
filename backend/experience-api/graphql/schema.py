import strawberry
from strawberry.fastapi import GraphQLRouter
from resolvers.content_resolver import ContentQuery
from resolvers.workflow_resolver import WorkflowQuery

@strawberry.type
class Query(ContentQuery, WorkflowQuery):
    pass

schema = strawberry.Schema(query=Query)
graphql_app = GraphQLRouter(schema)